import { Request, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';

export const listLetters = async (req: Request, res: Response) => {
    try {
        const { status, q, page = 1, limit = 10 } = req.query;
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
        if (q) {
            where.OR = [
                { letterNumber: { contains: String(q) } },
                { subject: { contains: String(q) } },
                { recipient: { contains: String(q) } }
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

        const formatted = letters.map(l => ({
            id: l.id,
            letterNumber: l.letterNumber,
            letterDate: l.letterDate,
            recipient: l.recipient,
            subject: l.subject,
            content: l.content,
            indexCode: l.index.code,
            indexName: l.index.name,
            status: l.status,
            pageCount: l.pageCount,
            attachmentPageCount: l.attachmentPageCount,
            userFish: l.user.fullName,
            userPosition: l.user.position,
            createdDate: l.createdAt.toISOString(),
            files: {
                xat: l.files.find(f => f.kind === 'XAT'),
                ilova: l.files.filter(f => f.kind === 'ILOVA')
            }
        }));

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
        if (!dbUser || dbUser.status !== 'active') {
            return res.status(403).json({ message: 'Hisobingiz faol emas, xat yarata olmaysiz.' });
        }

        // req.body contains text fields, req.files contains files
        // We need to handle multipart/form-data
        const { recipient, subject, summary, letterPages, attachmentPages, indexId, letterDate, status } = req.body;
        const userId = user.id;

        // Generate ID
        const letterNumber = `${Date.now()}`; // Simplified for MVP

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

        const letter = await prisma.letter.create({
            data: {
                letterNumber, // In real app, generate based on Index
                letterDate: letterDate || new Date().toISOString().split('T')[0],
                recipient,
                subject,
                content: summary,
                pageCount: Number(letterPages),
                attachmentPageCount: Number(attachmentPages),
                status: status || 'DRAFT',
                index: { connect: { id: indexId } },
                user: { connect: { id: userId } },
                files: {
                    create: filesData
                }
            }
        });

        res.status(201).json(letter);
    } catch (e) {
        console.error(e);
        res.status(400).json({ message: 'Error creating letter', error: String(e) });
    }
};

export const registerLetter = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const letter = await prisma.letter.findUnique({ where: { id } });

        if (!letter) return res.status(404).json({ message: 'Xat topilmadi' });

        // Only owner can register
        const user = (req as any).user;
        if (user.role !== 'admin' && letter.userId !== user.id) {
            return res.status(403).json({ message: 'Ruxsat yo\'q' });
        }

        const updated = await prisma.letter.update({
            where: { id },
            data: { status: 'REGISTERED' }
        });

        res.json(updated);
    } catch (e) {
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

        res.json({
            ...letter,
            userFish: letter.user.fullName,
            userPosition: letter.user.position,
            indexCode: letter.index.code,
            indexName: letter.index.name,
            // Ensure content is explicitly available if needed, usually ...letter handles it
            files: {
                xat: letter.files.find(f => f.kind === 'XAT'),
                ilova: letter.files.filter(f => f.kind === 'ILOVA')
            }
        });
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
