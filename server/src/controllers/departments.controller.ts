import { Request, Response } from 'express';
import { prisma } from '../db';

export const listDepartments = async (req: Request, res: Response) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });

        const formatted = departments.map(d => ({
            ...d,
            userCount: d._count.users
        }));

        res.json(formatted);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching departments' });
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const dept = await prisma.department.create({
            data: { name, description }
        });
        res.status(201).json(dept);
    } catch (e) {
        res.status(400).json({ message: 'Error creating department' });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const dept = await prisma.department.update({
            where: { id },
            data: { name, description }
        });
        res.json(dept);
    } catch (e) {
        res.status(400).json({ message: 'Error updating department' });
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.department.update({
            where: { id },
            data: { status: 'deleted', deletedAt: new Date() }
        });
        res.json({ message: 'Department deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Error deleting department' });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await prisma.department.update({
            where: { id },
            data: { status }
        });
        res.json({ message: `Department status updated to ${status}` });
    } catch (e) {
        res.status(500).json({ message: 'Error updating department status' });
    }
};

export const permanentDelete = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.department.delete({
            where: { id }
        });
        res.json({ message: 'Department permanently deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Error permanently deleting department' });
    }
};
