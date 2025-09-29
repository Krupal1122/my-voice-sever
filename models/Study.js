import mongoose from 'mongoose';

const StudySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['draft', 'active', 'available', 'completed', 'paused'], 
      default: 'available' 
    },
    participants: { type: Number, default: 0 },
    maxParticipants: { type: Number, default: null },
    targetParticipants: { type: Number, default: null }, // Keep both for compatibility
    reward: { type: Number, required: true },
    duration: { type: Number, required: true }, // Duration in minutes as number
    category: { 
      type: String, 
      enum: ['Market Research', 'Product Research', 'Social Research', 'Behavioral Research', 'Finance', 'Technologie', 'Santé & Bien-être', 'Mode & Beauté', 'Digital', 'Alimentation', 'Transport', 'E-commerce', 'Test'], 
      default: 'Market Research' 
    },
    deadline: { type: Date, default: null },
    endDate: { type: Date, default: null },
    startDate: { type: Date, default: Date.now },
    image: { type: String, default: '' },
    requirements: { type: String, default: '' },
    instructions: { type: String, default: '' },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { 
      _id: { type: String, default: 'admin' }, 
      name: { type: String, default: 'Admin' } 
    },
  },
  { timestamps: true }
);

export default mongoose.model('Study', StudySchema);
