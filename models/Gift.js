import mongoose from 'mongoose';

const giftSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['E-commerce', 'Culture', 'Streaming', 'Restauration', 'Beauté', 'Livres', 'Voyage', 'Sport']
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  availability: {
    type: String,
    required: true,
    enum: ['available', 'limited', 'out-of-stock'],
    default: 'available'
  },
  originalPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
giftSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Gift', giftSchema);
