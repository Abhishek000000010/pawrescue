import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['update', 'story', 'request', 'tip'],
    default: 'update'
  },
  title: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  cat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cat'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [String],
  isSuccessStory: {
    type: Boolean,
    default: false
  },
  beforeAfter: {
    beforeImg: String,
    afterImg: String,
    beforeLabel: String,
    afterLabel: String
  },
  reactions: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

export default mongoose.model('Post', postSchema);
