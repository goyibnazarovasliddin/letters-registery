import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes placeholder
app.get('/', (req, res) => {
    res.json({ message: 'Agrobank Admin Dashboard API' });
});

import routes from './routes';
app.use('/api', routes);

export default app;
