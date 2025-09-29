const express = require('express');
const { body } = require('express-validator');
const {
  createPost,
  getPosts,
  getPost,
  getPostBySlug,
  updatePost,
  deletePost,
  likePost
} = require('../controllers/postController');
const { authenticate, authorize, authorizeOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

const postValidation = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .isLength({ min: 1 })
    .withMessage('Content is required'),
  body('slug')
    .optional()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Excerpt cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each tag cannot exceed 50 characters'),
  body('seoTitle')
    .optional()
    .isLength({ max: 60 })
    .withMessage('SEO title cannot exceed 60 characters'),
  body('seoDescription')
    .optional()
    .isLength({ max: 160 })
    .withMessage('SEO description cannot exceed 160 characters')
];

const checkPostOwnership = async (req, res, next) => {
  try {
    const post = await require('../models/Post').findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    req.resource = post;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

router.get('/', getPosts);
router.get('/slug/:slug', getPostBySlug);
router.get('/:id', getPost);

router.post('/', authenticate, authorize('admin', 'editor', 'author'), postValidation, createPost);

router.put('/:id', authenticate, checkPostOwnership, authorizeOwnershipOrAdmin(), postValidation, updatePost);

router.delete('/:id', authenticate, checkPostOwnership, authorizeOwnershipOrAdmin(), deletePost);

router.post('/:id/like', likePost);

module.exports = router;