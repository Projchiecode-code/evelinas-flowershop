import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import reviewRoutes from './routes/reviews';
import galleryRoutes from './routes/gallery';
import notificationRoutes from './routes/notifications';
import userRoutes from './routes/users';
import { getJwtSecret } from './middleware/auth';

dotenv.config();

// Fail closed before anything else: production must never start with a
// publicly known JWT secret (see middleware/auth.ts).
getJwtSecret();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Evelina\'s Flowershop API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evelinas-flowershop');
    console.log('MongoDB connected');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`Local:   http://localhost:${PORT}`);
      console.log(`Network: http://0.0.0.0:${PORT}`);
    });

    server.on('error', (err: Error) => {
      console.error('Server error:', err);
      process.exit(1);
    });

    // Handle graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`${signal} received, shutting down gracefully`);
      server.close(() => {
        mongoose.connection.close(false, () => {
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

// Handle unhandled rejections
process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});