import { Request, Response } from 'express';
import { prisma } from '../db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const listUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: { not: 'admin' }
            },
            // Return all users so frontend can filter
            include: {
                department: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Sort logic: Deleted users/Recently modified users on top
        const safeUsers = users.map(user => {
            const { password, ...rest } = user;
            return {
                ...rest,
                department: user.department?.name,
                createdDate: user.createdAt.toISOString()
            };
        }).sort((a, b) => {
            const timeA = Math.max(
                a.deletedAt ? new Date(a.deletedAt).getTime() : 0,
                new Date(a.updatedAt).getTime(),
                new Date(a.createdAt).getTime()
            );
            const timeB = Math.max(
                b.deletedAt ? new Date(b.deletedAt).getTime() : 0,
                new Date(b.updatedAt).getTime(),
                new Date(b.createdAt).getTime()
            );
            return timeB - timeA;
        });

        res.json(safeUsers);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            username: z.string(),
            password: z.string().min(6),
            fullName: z.string(),
            position: z.string(),
            role: z.enum(['admin', 'user']),
            departmentId: z.string().optional()
        });

        const data = schema.parse(req.body);

        const existing = await prisma.user.findUnique({ where: { username: data.username } });
        if (existing) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
                mustChangePasswordOnNextLogin: true
            }
        });

        const { password, ...safeUser } = newUser;
        res.status(201).json(safeUser);
    } catch (e) {
        res.status(400).json({ message: 'Error creating user', error: e });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { password, ...data } = req.body;

        const updateData: any = { ...data };
        if (password && password.length >= 6) {
            updateData.password = await bcrypt.hash(password, 10);
            updateData.tokenVersion = { increment: 1 };
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        const { password: _, ...safeUser } = updatedUser;
        res.json(safeUser);
    } catch (e) {
        res.status(400).json({ message: 'Error updating user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.update({
            where: { id },
            data: { status: 'deleted', deletedAt: new Date() }
        });
        res.json({ message: 'User deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await prisma.user.update({
            where: { id },
            data: { status }
        });
        res.json({ message: `User status updated to ${status}` });
    } catch (e) {
        res.status(500).json({ message: 'Error updating user status' });
    }
};

export const permanentDelete = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({
            where: { id }
        });
        res.json({ message: 'User permanently deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Error permanently deleting user' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Generate random 12 char password
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        let newPassword = '';
        for (let i = 0; i < 12; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                mustChangePasswordOnNextLogin: true,
                tokenVersion: { increment: 1 }
            }
        });

        res.json({ newPassword });
    } catch (e) {
        res.status(500).json({ message: 'Error resetting password' });
    }
};
