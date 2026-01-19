import { Request, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';

const formatLetter = (l: any) => {
    if (!l) return null;

    // Self-healing: If REGISTERED but no registeredAt, use updatedDate
    // This handles legacy or race-condition data
    let safeRegisteredAt = l.registeredAt?.toISOString() || null;
    if (l.status === 'REGISTERED' && !safeRegisteredAt) {
        // We can't await here easily as it's a sync mapper, but we can set the return value to be consistent
        safeRegisteredAt = l.updatedAt.toISOString();

        // Fire-and-forget DB repair (async)
        prisma.letter.update({
            where: { id: l.id },
            data: { registeredAt: l.updatedAt }
        }).catch(err => console.error(`[Auto-Repair] Failed to patch letter ${l.id}`, err));
    }

    const formatted = {
        id: l.id,
        letterNumber: l.letterNumber,
        letterDate: l.letterDate,
        recipient: l.recipient,
        subject: l.subject,
        summary: l.content, // mapping db content to summary
        indexId: l.indexId,
        indexCode: l.index?.code,
        indexName: l.index?.name,
        status: l.status,
        pageCount: l.pageCount,
        attachmentPageCount: l.attachmentPageCount,
        userFish: l.user?.fullName,
        userPosition: l.user?.position,
        userId: l.userId,
        createdDate: l.createdAt.toISOString(),
        updatedDate: l.updatedAt.toISOString(),
        registeredAt: safeRegisteredAt,
        files: {
            xat: l.files?.find((f: any) => f.kind === 'XAT'),
            ilova: l.files?.filter((f: any) => f.kind === 'ILOVA') || []
        }
    };
    return formatted;
};

export const listLetters = async (req: Request, res: Response) => {
    try {
        const { status, q, page = 1, limit = 10, year } = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const user = (req as any).user;

        const where: any = {};

        // If not admin, only show own letters
        if (user.role !== 'admin') {
            where.userId = user.id;
        } else {
            // Admin should only see REGISTERED letters (hide drafts)
            where.status = { not: 'DRAFT' };
        }

        if (status && status !== 'all') {
            where.status = status;
        }

        // Year filter
        if (year) {
            // Prisma doesn't have direct Year function in SQLite easily for complex where usually, 
            // but string comparison works if format is YYYY-MM-DD
            where.letterDate = {
                startsWith: String(year)
            };
        }

        if (q) {
            where.OR = [
                { letterNumber: { contains: String(q) } },
                { subject: { contains: String(q) } },
                { recipient: { contains: String(q) } },
                { content: { contains: String(q) } },
                // Search by user name for admin
                { user: { fullName: { contains: String(q) } } }
            ];
        }

        const [total, letters] = await prisma.$transaction([
            prisma.letter.count({ where }),
            prisma.letter.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    user: true,
                    index: true,
                    files: true
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const formatted = letters.map(l => formatLetter(l));

        res.json({
            items: formatted,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (e) {
        res.status(500).json({ message: 'Error fetching letters', error: e });
    }
};

export const createLetter = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        // Check if user is active
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser || dbUser.status === 'deleted') {
            return res.status(401).json({ message: 'User not found or deleted' });
        }
        if (dbUser.status !== 'active') { // Block Create for Inactive
            return res.status(403).json({ message: 'Hisobingiz faol emas. Xat yarata olmaysiz.' });
        }

        // req.body contains text fields, req.files contains files
        // We need to handle multipart/form-data
        const { recipient, subject, summary, letterPages, attachmentPages, indexId, letterDate, status } = req.body;
        const userId = user.id;

        // Date validation: No future dates allowed
        const todayStr = new Date().toISOString().split('T')[0];
        let finalizedDate = letterDate || todayStr;

        if (finalizedDate > todayStr) {
            return res.status(400).json({ message: 'Kelajak sanasiga xat yozish mumkin emas' });
        }

        // Check past dates restriction
        const settings = await prisma.systemSettings.findFirst();
        const allowPastDates = settings?.allowPastDates ?? false;

        if (!allowPastDates && finalizedDate < todayStr) {
            finalizedDate = todayStr; // Force today if past dates not allowed
        }

        const filesData = [];
        if (req.files) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            // xatFile is now optional
            if (files['xatFile']) {
                const f = files['xatFile'][0];
                filesData.push({
                    kind: 'XAT',
                    fileName: f.originalname,
                    mimeType: f.mimetype,
                    size: f.size,
                    path: f.path
                });
            }

            if (files['ilovaFiles']) {
                files['ilovaFiles'].forEach(f => {
                    filesData.push({
                        kind: 'ILOVA',
                        fileName: f.originalname,
                        mimeType: f.mimetype,
                        size: f.size,
                        path: f.path
                    });
                });
            }
        }
        const letter = await prisma.letter.create({
            data: {
                letterDate: finalizedDate,
                recipient: recipient || null,
                subject: subject || null,
                content: summary,
                pageCount: Number(letterPages) || 0,
                attachmentPageCount: Number(attachmentPages) || 0,
                status: status || 'DRAFT',
                registeredAt: status === 'REGISTERED' ? new Date() : null,
                ...(indexId ? { index: { connect: { id: indexId } } } : {}),
                user: { connect: { id: userId } },
                files: {
                    create: filesData
                }
            },
            include: { index: true }
        });

        // If status is REGISTERED, generating number immediately
        if (status === 'REGISTERED') {
            const result = await prisma.$transaction(async (tx) => {
                const l = await tx.letter.findUnique({ where: { id: letter.id }, include: { index: true } });
                if (!l) throw new Error("Letter lost");

                const yearStr = l.letterDate.split('-')[0];
                const targetYear = parseInt(yearStr, 10);

                const counter = await tx.yearCounter.upsert({
                    where: { year: targetYear },
                    update: { lastSequence: { increment: 1 } },
                    create: { year: targetYear, lastSequence: 1 }
                });

                const sequence = counter.lastSequence;
                const letterNumber = `${l.index?.code}/${sequence}`;

                return await tx.letter.update({
                    where: { id: l.id },
                    data: { letterNumber, registeredAt: new Date() },
                    include: { user: true, index: true, files: true }
                });
            });
            return res.status(201).json(formatLetter(result));
        }

        const fullLetter = await prisma.letter.findUnique({
            where: { id: letter.id },
            include: { index: true, user: true, files: true }
        });

        res.status(201).json(formatLetter(fullLetter));
    } catch (e) {
        console.error(e);
        res.status(400).json({ message: 'Error creating letter', error: String(e) });
    }
};

export const updateLetter = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        // Find existing letter
        const existingLetter = await prisma.letter.findUnique({ where: { id } });

        if (!existingLetter) {
            return res.status(404).json({ message: 'Xat topilmadi' });
        }

        // Only owner can update their draft
        if (user.role !== 'admin' && existingLetter.userId !== user.id) {
            return res.status(403).json({ message: 'Ruxsat yo\'q' });
        }

        // Only drafts can be updated
        if (existingLetter.status !== 'DRAFT') {
            return res.status(400).json({ message: 'Faqat qoralamalarni tahrirlash mumkin' });
        }

        const { recipient, subject, summary, letterPages, attachmentPages, indexId, letterDate, status } = req.body;

        // Date validation: No future dates allowed
        const todayStr = new Date().toISOString().split('T')[0];
        let finalizedDate = letterDate || existingLetter.letterDate;

        if (finalizedDate > todayStr) {
            return res.status(400).json({ message: 'Kelajak sanasiga xat yozish mumkin emas' });
        }

        // Check past dates restriction
        const settings = await prisma.systemSettings.findFirst();
        const allowPastDates = settings?.allowPastDates ?? false;

        if (!allowPastDates && finalizedDate < todayStr) {
            // If updating an existing letter and past dates are NOT allowed, 
            // but the new date is earlier than today, force it to today.
            // Note: If the existing letter already had a past date (created when it was allowed), 
            // we only force today if the user is attempting to CHANGE it to a past date or if we want strict enforcement.
            // The prompt says "if it is disabled, date must be unchangable and today;s date".
            finalizedDate = todayStr;
        }

        // Handle new files if uploaded
        const filesData = [];
        if (req.files) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            if (files['xatFile']) {
                const f = files['xatFile'][0];
                filesData.push({
                    kind: 'XAT',
                    fileName: f.originalname,
                    mimeType: f.mimetype,
                    size: f.size,
                    path: f.path
                });
            }

            if (files['ilovaFiles']) {
                files['ilovaFiles'].forEach(f => {
                    filesData.push({
                        kind: 'ILOVA',
                        fileName: f.originalname,
                        mimeType: f.mimetype,
                        size: f.size,
                        path: f.path
                    });
                });
            }
        }

        // Update letter
        let updated = await prisma.letter.update({
            where: { id },
            data: {
                letterDate: finalizedDate,
                recipient: recipient || null,
                subject: subject || null,
                content: summary,
                pageCount: letterPages ? Number(letterPages) : undefined,
                attachmentPageCount: attachmentPages ? Number(attachmentPages) : undefined,
                status: status || existingLetter.status,
                registeredAt: (status === 'REGISTERED' && (existingLetter.status as string) !== 'REGISTERED') ? new Date() : undefined,
                indexId: indexId || null,
                // Add new files if any
                ...(filesData.length > 0 && {
                    files: {
                        create: filesData
                    }
                })
            },
            include: {
                user: true,
                index: true,
                files: true
            }
        });

        // If status became REGISTERED and no number exists, generate it
        if (status === 'REGISTERED' && !updated.letterNumber) {
            const result = await prisma.$transaction(async (tx) => {
                const l = await tx.letter.findUnique({ where: { id: updated.id }, include: { index: true } });
                if (!l) throw new Error("Letter lost");

                const yearStr = l.letterDate.split('-')[0];
                const targetYear = parseInt(yearStr, 10);

                const counter = await tx.yearCounter.upsert({
                    where: { year: targetYear },
                    update: { lastSequence: { increment: 1 } },
                    create: { year: targetYear, lastSequence: 1 }
                });

                const sequence = counter.lastSequence;
                const letterNumber = `${l.index?.code}/${sequence}`;

                return await tx.letter.update({
                    where: { id: l.id },
                    data: { letterNumber, registeredAt: new Date() },
                    include: { user: true, index: true, files: true }
                });
            });
            updated = result as any;
        }

        res.json(formatLetter(updated));
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error updating letter' });
    }
};


export const registerLetter = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Use transaction to ensure atomicity of sequence generation
        const result = await prisma.$transaction(async (tx) => {
            const letter = await tx.letter.findUnique({
                where: { id },
                include: { index: true } // Need index code
            });

            if (!letter) throw new Error('NOT_FOUND');

            // Only owner can register (or admin)
            const user = (req as any).user;
            if (user.role !== 'admin' && letter.userId !== user.id) {
                throw new Error('FORBIDDEN');
            }

            // Validate required fields
            if (!letter.indexId || !letter.index) {
                throw new Error('MISSING_INDEX');
            }
            if (!letter.recipient) {
                throw new Error('MISSING_RECIPIENT');
            }
            if (!letter.subject) {
                throw new Error('MISSING_SUBJECT');
            }

            // Prevent double registration
            if (letter.status === 'REGISTERED') {
                return letter; // Already registered, just return it
            }

            // Determine Year from letterDate logic
            // Requirements: 
            // - targetYear = year(letterDate)
            // - letterDate is "YYYY-MM-DD"
            const yearStr = letter.letterDate.split('-')[0];
            const targetYear = parseInt(yearStr, 10);

            if (isNaN(targetYear)) {
                throw new Error('INVALID_DATE');
            }

            console.log(`[Register] Generating number for Year: ${targetYear}, Index: ${letter.index.code}`);

            // Atomic Sequence Generation
            // Upsert year counter: if exists, increment; if not, create with 1 (lastSequence will be 1 after increment? No, create with 0 then increment, strictly.)
            // Actually, usually we want: get current, increment, save.
            // Using upsert to initialize if missing.

            // We need to lock or ensure atomic update.
            // SQLite doesn't support SELECT ... FOR UPDATE easily in Prisma without raw query, 
            // but we can use atomic update: increment.

            const counter = await tx.yearCounter.upsert({
                where: { year: targetYear },
                update: { lastSequence: { increment: 1 } },
                create: { year: targetYear, lastSequence: 1 }
            });

            const sequence = counter.lastSequence;
            const letterNumber = `${letter.index.code}/${sequence}`;
            console.log(`[Register] Generated Sequence: ${sequence}, LetterNumber: ${letterNumber}`);

            // Update letter
            const updated = await tx.letter.update({
                where: { id },
                data: {
                    status: 'REGISTERED',
                    letterNumber: letterNumber,
                    registeredAt: new Date(),
                    // Ensure createdAt is preserved (it's immutable by default definition but good to know)
                },
                include: {
                    user: true,
                    index: true,
                    files: true
                }
            });

            return updated;
        });

        console.log(`[Register] Success for ID: ${id}, Result Status: ${result.status}, RegisteredAt: ${result.registeredAt}`);
        res.json(formatLetter(result));

    } catch (e: any) {
        if (e.message === 'NOT_FOUND') return res.status(404).json({ message: 'Xat topilmadi' });
        if (e.message === 'FORBIDDEN') return res.status(403).json({ message: 'Ruxsat yo\'q' });
        if (e.message === 'MISSING_INDEX') return res.status(400).json({ message: 'Ro\'yxatga olish uchun indeks tanlanishi shart' });
        if (e.message === 'MISSING_RECIPIENT') return res.status(400).json({ message: 'Ro\'yxatga olish uchun qabul qiluvchi kiritilishi shart' });
        if (e.message === 'MISSING_SUBJECT') return res.status(400).json({ message: 'Ro\'yxatga olish uchun mavzu kiritilishi shart' });

        console.error("Register Error:", e);
        res.status(500).json({ message: 'Error registering letter' });
    }
};


export const getLetter = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const letter = await prisma.letter.findUnique({
            where: { id },
            include: {
                user: true,
                index: true,
                files: true
            }
        });

        if (!letter) return res.status(404).json({ message: 'Letter not found' });

        const user = (req as any).user;
        if (user.role !== 'admin' && letter.userId !== user.id) {
            return res.status(403).json({ message: 'Ruxsat yo\'q' });
        }

        res.json(formatLetter(letter));
    } catch (e) {
        res.status(500).json({ message: 'Error fetching letter' });
    }
};

export const downloadFile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const file = await prisma.file.findUnique({ where: { id } });

        if (!file) {
            return res.status(404).json({ message: 'Fayl topilmadi' });
        }

        res.download(file.path, file.fileName);
    } catch (e) {
        res.status(500).json({ message: 'Error downloading file' });
    }
};
