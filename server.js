import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import faqRouter from './routes/faq.js';
import studiesRouter from './routes/studies.js';
import giftsRouter from './routes/gifts.js';
import questionsRouter from './routes/questions.js';
import otpRouter from './routes/otp.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/faqs', faqRouter);
app.use('/api/studies', studiesRouter);
app.use('/api/gifts', giftsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/otp', otpRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/myvoice';

async function start() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'myvoice' });
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (e) {
    console.error('Failed to start server:', e);
    process.exit(1);
  }
}

start();

 