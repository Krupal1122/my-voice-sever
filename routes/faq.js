import express from 'express';
import FAQ from '../models/FAQ.js'; 

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const faqs = await FAQ.find().sort({ priority: -1, createdAt: -1 });
    res.json({ faqs });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { question, answer, category } = req.body;
    if (!question || !answer) return res.status(400).json({ message: 'question and answer are required' });
    const faq = await FAQ.create({ question, answer, category });
    res.status(201).json({ faq });
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndUpdate(id, req.body, { new: true });
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json({ faq });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndDelete(id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;

 