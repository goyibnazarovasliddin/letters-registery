import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';

export const login = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            username: z.string(),
            password: z.string()
        });
        const { username, password } = schema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });
        }

        if (user.status === 'deleted') {
            const deletedAt = user.deletedAt ? new Date(user.deletedAt) : new Date();
            const daysSinceDeleted = Math.floor((new Date().getTime() - deletedAt.getTime()) / (1000 * 3600 * 24));
            const daysLeft = Math.max(0, 30 - daysSinceDeleted);

            return res.status(403).json({
                message: `Hisobingiz admin tomonidan o'chirilgan. ${daysLeft} kundan keyin butunlay o'chib ketadi. Qayta tiklash uchun admin bilan bog'laning.`
            });
        }


        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, tokenVersion: user.tokenVersion },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user info (excluding password)
        const { password: _, ...userInfo } = user;

        res.json({
            accessToken: token,
            user: userInfo
        });
    } catch (e) {
        res.status(400).json({ message: 'Xatolik yuz berdi', error: e });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        // Assume auth middleware adds user to req
        const userId = (req as any).user.id;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 5) {
            return res.status(400).json({ message: 'Parol juda qisqa' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                mustChangePasswordOnNextLogin: false
            }
        });

        res.json({ message: 'Parol muvaffaqiyatli o\'zgartirildi' });
    } catch (e) {
        res.status(500).json({ message: 'Xatolik yuz berdi' });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { password, ...userInfo } = user;
        res.json(userInfo);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching user info' });
    }
};
