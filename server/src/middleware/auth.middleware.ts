import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
        if (err) return res.sendStatus(403);

        try {
            // Real-time check: fetch user from DB
            // We need to dynamic import or use existing prisma instance. 
            // Assuming prisma is exported from '../db'
            const { prisma } = require('../db');

            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user || user.status === 'deleted') {
                return res.status(401).json({ message: 'User not found or deleted' });
            }

            if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
                return res.status(401).json({ message: 'Session expired (password changed)' });
            }

            // Note: We allow 'inactive' users to pass generic authentication (to read data), 
            // but specific write permissions will be blocked in controllers.
            // if (user.status !== 'active') { // REMOVED to allow simple login
            //    return res.status(403).json({ message: 'Account is inactive' });
            // }

            (req as any).user = user;
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.sendStatus(500);
        }
    });
};
