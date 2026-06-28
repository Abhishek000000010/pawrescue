import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import catRoutes from './routes/catRoutes.js';
import missionRoutes from './routes/missionRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

import { initSocket } from './services/socketService.js';

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cats', catRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/payments', paymentRoutes);


app.get('/', (req, res) => {
  res.send('PawNet API is running...');
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
