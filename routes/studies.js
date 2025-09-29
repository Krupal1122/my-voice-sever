import express from 'express';
import Study from '../models/Study.js';

const router = express.Router();

// Get all studies
router.get('/', async (_req, res, next) => {
  try {
    const studies = await Study.find().sort({ createdAt: -1 });
    res.json({ studies });
  } catch (e) { 
    next(e); 
  }
});

// Get active studies (for homepage)
router.get('/active', async (_req, res, next) => {
  try {
    const studies = await Study.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json({ studies });
  } catch (e) { 
    next(e); 
  }
});

// Get study by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const study = await Study.findById(id);
    if (!study) return res.status(404).json({ message: 'Study not found' });
    res.json({ study });
  } catch (e) { 
    next(e); 
  }
});

// Create new study
router.post('/', async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      targetParticipants, 
      maxParticipants,
      reward, 
      duration, 
      category, 
      deadline, 
      image,
      requirements,
      instructions,
      tags
    } = req.body;
    
    if (!title || !description || !reward || !duration) {
      return res.status(400).json({ 
        message: 'title, description, reward, and duration are required' 
      });
    }
    
    // Convert duration to number if it's a string like "15 minutes"
    let durationInMinutes = duration;
    if (typeof duration === 'string') {
      const match = duration.match(/(\d+)/);
      durationInMinutes = match ? parseInt(match[1]) : 15;
    }
    
    // Validate duration is a positive number
    if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
      return res.status(400).json({ 
        message: 'Duration must be a positive number (in minutes)' 
      });
    }
    
    const study = await Study.create({ 
      title, 
      description, 
      maxParticipants: maxParticipants || targetParticipants,
      targetParticipants: targetParticipants || maxParticipants,
      reward, 
      duration: durationInMinutes, 
      category: category || 'Market Research', 
      deadline: deadline ? new Date(deadline) : null, 
      image: image || '',
      requirements: requirements || '',
      instructions: instructions || '',
      tags: tags || [],
      status: 'available'
    });
    
    res.status(201).json({ study });
  } catch (e) { 
    next(e); 
  }
});

// Update study
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const study = await Study.findByIdAndUpdate(id, req.body, { new: true });
    if (!study) return res.status(404).json({ message: 'Study not found' });
    res.json({ study });
  } catch (e) { 
    next(e); 
  }
});

// Delete study
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const study = await Study.findByIdAndDelete(id);
    if (!study) return res.status(404).json({ message: 'Study not found' });
    res.json({ ok: true });
  } catch (e) { 
    next(e); 
  }
});

// Update study participants (when someone joins)
router.patch('/:id/participate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const study = await Study.findById(id);
    if (!study) return res.status(404).json({ message: 'Study not found' });
    
    if (study.participants >= study.targetParticipants) {
      return res.status(400).json({ message: 'Study is full' });
    }
    
    study.participants += 1;
    await study.save();
    
    res.json({ study });
  } catch (e) { 
    next(e); 
  }
});

export default router;
