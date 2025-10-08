import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    index: true 
  },
  otpHash: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  used: {
    type: Boolean,
    default: false
  }
});

// TTL index to automatically delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OtpToken', otpSchema);
