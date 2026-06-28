import Post from '../models/Post.js';

export const getPosts = async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};
    
    if (category === 'success') filter.isSuccessStory = true;
    else if (category === 'urgent') filter.tags = { $regex: /urgent/i };
    else if (category === 'vet') filter.tags = { $regex: /vet|care|nutrition/i };

    const posts = await Post.find(filter)
      .populate('author', 'name avatar role')
      .populate('comments.author', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, title, tags, isSuccessStory } = req.body;
    let image = null;

    if (req.file) {
      image = req.file.path;
    }

    const parsedTags = tags ? JSON.parse(tags) : [];

    const post = await Post.create({
      author: req.user._id,
      content,
      title,
      image,
      tags: parsedTags,
      isSuccessStory: isSuccessStory === 'true'
    });

    const populatedPost = await Post.findById(post._id).populate('author', 'name avatar role');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error liking post', error: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      author: req.user._id,
      text
    });

    await post.save();
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name avatar role')
      .populate('comments.author', 'name avatar');
      
    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Allow deletion if user is the author, or if user is an admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully', postId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
};
