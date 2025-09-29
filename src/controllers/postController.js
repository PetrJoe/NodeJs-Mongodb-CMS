const { validationResult } = require('express-validator');
const Post = require('../models/Post');
const Category = require('../models/Category');

const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const postData = {
      ...req.body,
      author: req.user._id
    };

    if (postData.category) {
      const category = await Category.findById(postData.category);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    const post = new Post(postData);
    await post.save();
    await post.populate('author', 'username fullName avatar');
    await post.populate('category', 'name slug');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error during post creation' });
  }
};

const getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      author,
      search,
      featured,
      sort = '-createdAt'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (author) query.author = author;
    if (featured !== undefined) query.isFeatured = featured === 'true';

    if (search) {
      query.$text = { $search: search };
    }

    const posts = await Post.find(query)
      .populate('author', 'username fullName avatar')
      .populate('category', 'name slug color')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Server error fetching posts' });
  }
};

const getPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('author', 'username fullName avatar bio')
      .populate('category', 'name slug color description');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (req.query.increment_views === 'true') {
      post.views += 1;
      await post.save();
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Server error fetching post' });
  }
};

const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await Post.findOne({ slug })
      .populate('author', 'username fullName avatar bio')
      .populate('category', 'name slug color description');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (req.query.increment_views === 'true') {
      post.views += 1;
      await post.save();
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post by slug error:', error);
    res.status(500).json({ error: 'Server error fetching post' });
  }
};

const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.category) {
      const category = await Category.findById(updateData.category);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    const post = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('author', 'username fullName avatar')
      .populate('category', 'name slug color');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Server error during post update' });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error during post deletion' });
  }
};

const likePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      message: 'Post liked successfully',
      likes: post.likes
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  getPostBySlug,
  updatePost,
  deletePost,
  likePost
};