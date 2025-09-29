import mongoose from 'mongoose';

const HelpfulSchema = new mongoose.Schema(
  { yes: { type: Number, default: 0 }, no: { type: Number, default: 0 } },
  { _id: false }
);

const FAQSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'Gains' },
    priority: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    views: { type: Number, default: 0 },
    helpful: { type: HelpfulSchema, default: () => ({}) },
    createdBy: { _id: { type: String, default: 'system' }, name: { type: String, default: 'System' } },
  },
  { timestamps: true }
);

export default mongoose.model('FAQ', FAQSchema);

 