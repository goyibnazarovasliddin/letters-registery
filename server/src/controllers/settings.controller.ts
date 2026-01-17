import { Request, Response } from 'express';
import { prisma } from '../db';
import { SystemSettings } from '@prisma/client';

export const getSettings = async (req: Request, res: Response) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { allowPastDates: false }
            });
        }
        res.json(settings);
    } catch (e) {
        console.error('Error fetching settings:', e);
        res.status(500).json({ message: 'Error fetching settings' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const { allowPastDates } = req.body;
        const user = (req as any).user;

        // Ensure only admin can update settings
        // Assuming 'admin' role check is sufficient. 
        // Real-world might need more granular permissions.
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Ruxsat yo\'q' });
        }

        let settings = await prisma.systemSettings.findFirst();
        if (settings) {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: { allowPastDates: Boolean(allowPastDates) }
            });
        } else {
            settings = await prisma.systemSettings.create({
                data: { allowPastDates: Boolean(allowPastDates) }
            });
        }
        res.json(settings);
    } catch (e) {
        console.error('Error updating settings:', e);
        res.status(500).json({ message: 'Error updating settings' });
    }
};
