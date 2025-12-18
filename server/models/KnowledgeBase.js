const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['faq', 'policy', 'guide', 'general'],
    index: true
  },
  question: {
    type: String,
    required: true,
    index: true
  },
  answer: {
    type: String,
    required: true
  },
  keywords: [{
    type: String,
    lowercase: true
  }],
  tags: [{
    type: String,
    lowercase: true
  }],
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  relatedToDestination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination'
  },
  relatedToActivity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  }
}, {
  timestamps: true
});

// Indexes for fast search
knowledgeBaseSchema.index({ question: 'text', answer: 'text', keywords: 'text' });
knowledgeBaseSchema.index({ category: 1, priority: -1 });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
