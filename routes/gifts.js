import express from 'express';
import Gift from '../models/Gift.js';

const router = express.Router();

// Get all gifts
router.get('/', async (req, res) => {
  try {
    const { category, availability, search } = req.query;
    
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (availability && availability !== 'all') {
      query.availability = availability;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const gifts = await Gift.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      gifts,
      total: gifts.length
    });
  } catch (error) {
    console.error('Error fetching gifts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gifts',
      error: error.message
    });
  }
});

// Get single gift
router.get('/:id', async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    
    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }
    
    res.json({
      success: true,
      gift
    });
  } catch (error) {
    console.error('Error fetching gift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gift',
      error: error.message
    });
  }
});

// Create new gift
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      points,
      category,
      image,
      availability,
      originalPrice,
      discount
    } = req.body;
    
    // Validation
    if (!title || !description || !points || !category || !image) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    if (points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Points must be greater than 0'
      });
    }
    
    const gift = new Gift({
      title,
      description,
      points,
      category,
      image,
      availability: availability || 'available',
      originalPrice: originalPrice || 0,
      discount: discount || 0
    });
    
    await gift.save();
    
    res.status(201).json({
      success: true,
      message: 'Gift created successfully',
      gift
    });
  } catch (error) {
    console.error('Error creating gift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gift',
      error: error.message
    });
  }
});

// Update gift
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      points,
      category,
      image,
      availability,
      originalPrice,
      discount
    } = req.body;
    
    const gift = await Gift.findById(req.params.id);
    
    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }
    
    // Update fields
    if (title) gift.title = title;
    if (description) gift.description = description;
    if (points !== undefined) gift.points = points;
    if (category) gift.category = category;
    if (image) gift.image = image;
    if (availability) gift.availability = availability;
    if (originalPrice !== undefined) gift.originalPrice = originalPrice;
    if (discount !== undefined) gift.discount = discount;
    
    await gift.save();
    
    res.json({
      success: true,
      message: 'Gift updated successfully',
      gift
    });
  } catch (error) {
    console.error('Error updating gift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gift',
      error: error.message
    });
  }
});

// Delete gift
router.delete('/:id', async (req, res) => {
  try {
    const gift = await Gift.findByIdAndDelete(req.params.id);
    
    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Gift deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gift',
      error: error.message
    });
  }
});

// Get gift statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalGifts = await Gift.countDocuments();
    const availableGifts = await Gift.countDocuments({ availability: 'available' });
    const limitedGifts = await Gift.countDocuments({ availability: 'limited' });
    const outOfStockGifts = await Gift.countDocuments({ availability: 'out-of-stock' });
    
    // Category breakdown
    const categoryStats = await Gift.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        total: totalGifts,
        available: availableGifts,
        limited: limitedGifts,
        outOfStock: outOfStockGifts,
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching gift stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gift statistics',
      error: error.message
    });
  }
});

export default router;
