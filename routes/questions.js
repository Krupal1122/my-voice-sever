import express from 'express';
import Question from '../models/Question.js';

const router = express.Router();

// Get all questions
router.get('/', async (req, res) => {
  try {
    const { status, category, search } = req.query;
    
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const questions = await Question.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      questions,
      total: questions.length
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
});

// Get single question
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    res.json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question',
      error: error.message
    });
  }
});

// Create new question
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      image,
      options,
      category,
      tags,
      author
    } = req.body;
    
    // Validation
    if (!title || !description || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and at least 2 options are required'
      });
    }
    
    if (!author) {
      return res.status(400).json({
        success: false,
        message: 'Author is required'
      });
    }
    
    const question = new Question({
      title,
      description,
      image: image || '',
      options: options.map(option => ({
        text: option.text,
        votes: 0
      })),
      category: category || 'Other',
      tags: tags || [],
      author,
      status: 'draft'
    });
    
    await question.save();
    
    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create question',
      error: error.message
    });
  }
});

// Update question
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      image,
      options,
      category,
      tags,
      status
    } = req.body;
    
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Update fields
    if (title) question.title = title;
    if (description) question.description = description;
    if (image !== undefined) question.image = image;
    if (options && Array.isArray(options)) {
      question.options = options.map(option => ({
        text: option.text,
        votes: option.votes || 0
      }));
    }
    if (category) question.category = category;
    if (tags) question.tags = tags;
    if (status) question.status = status;
    
    await question.save();
    
    res.json({
      success: true,
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question',
      error: error.message
    });
  }
});

// Delete question
router.delete('/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question',
      error: error.message
    });
  }
});

// Vote on question
router.post('/:id/vote', async (req, res) => {
  try {
    const { optionIndex } = req.body;
    
    if (optionIndex === undefined || optionIndex < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid option index is required'
      });
    }
    
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    if (question.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Question is not published'
      });
    }
    
    if (optionIndex >= question.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option index'
      });
    }
    
    // Increment vote count for the selected option
    question.options[optionIndex].votes += 1;
    question.totalVotes += 1;
    
    await question.save();
    
    res.json({
      success: true,
      message: 'Vote recorded successfully',
      question
    });
  } catch (error) {
    console.error('Error voting on question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote',
      error: error.message
    });
  }
});

// Like question
router.post('/:id/like', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    question.totalLikes += 1;
    await question.save();
    
    res.json({
      success: true,
      message: 'Like recorded successfully',
      question
    });
  } catch (error) {
    console.error('Error liking question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record like',
      error: error.message
    });
  }
});

// Get question statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalQuestions = await Question.countDocuments();
    const publishedQuestions = await Question.countDocuments({ status: 'published' });
    const draftQuestions = await Question.countDocuments({ status: 'draft' });
    const closedQuestions = await Question.countDocuments({ status: 'closed' });
    
    // Category breakdown
    const categoryStats = await Question.aggregate([
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
    
    // Total votes across all questions
    const totalVotesResult = await Question.aggregate([
      {
        $group: {
          _id: null,
          totalVotes: { $sum: '$totalVotes' },
          totalLikes: { $sum: '$totalLikes' },
          totalComments: { $sum: '$totalComments' }
        }
      }
    ]);
    
    const totalVotes = totalVotesResult.length > 0 ? totalVotesResult[0].totalVotes : 0;
    const totalLikes = totalVotesResult.length > 0 ? totalVotesResult[0].totalLikes : 0;
    const totalComments = totalVotesResult.length > 0 ? totalVotesResult[0].totalComments : 0;
    
    res.json({
      success: true,
      stats: {
        total: totalQuestions,
        published: publishedQuestions,
        draft: draftQuestions,
        closed: closedQuestions,
        categories: categoryStats,
        totalVotes,
        totalLikes,
        totalComments
      }
    });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question statistics',
      error: error.message
    });
  }
});

export default router;
