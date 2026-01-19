import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
import routes from './routes';
app.use('/api', routes);

// Serve frontend static files
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Catch-all route for SPA
app.get('*', (req, res) => {
    // If it's not an API request, serve index.html
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
    } else {
        res.status(404).json({ error: 'API route not found' });
    }
});

export default app;
