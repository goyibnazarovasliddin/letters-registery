import { Request, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';

export const listIndices = async (req: Request, res: Response) => {
    try {
        // Return all indices so frontend can filter by status (active/deleted)
        const indices = await prisma.index.findMany();
        res.json(indices);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching indices' });
    }
};

export const createIndex = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            code: z.string(),
            name: z.string()
        });
        const data = schema.parse(req.body);

        const existing = await prisma.index.findUnique({ where: { code: data.code } });
        if (existing) {
            return res.status(400).json({ message: 'Code already exists' });
        }

        const index = await prisma.index.create({
            data: { ...data, status: 'active' }
        });
        res.status(201).json(index);
    } catch (e) {
        res.status(400).json({ message: 'Error creating index' });
    }
};

export const updateIndex = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name } = req.body;
        const index = await prisma.index.update({
            where: { id },
            data: { code, name }
        });
        res.json(index);
    } catch (e) {
        res.status(400).json({ message: 'Error updating index' });
    }
};

export const deleteIndex = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.index.update({
            where: { id },
            data: { status: 'deleted', deletedAt: new Date() }
        });
        res.json({ message: 'Index deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Error deleting index' });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // active, archived, deleted

        await prisma.index.update({
            where: { id },
            data: { status }
        });
        res.json({ message: `Index status updated to ${status}` });
    } catch (e) {
        res.status(500).json({ message: 'Error updating index status' });
    }
};

export const permanentDelete = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.index.delete({
            where: { id }
        });
        res.json({ message: 'Index permanently deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Error permanently deleting index' });
    }
};
