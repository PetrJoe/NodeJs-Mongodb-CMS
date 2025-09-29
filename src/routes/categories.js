const express = require('express');
const { body } = require('express-validator');
const {
  createCategory,
  getCategories,
  getCategoriesHierarchy,
  getCategory,
  getCategoryBySlug,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const categoryValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters'),
  body('slug')
    .optional()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

router.get('/', getCategories);
router.get('/hierarchy', getCategoriesHierarchy);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);

router.post('/', authenticate, authorize('admin', 'editor'), categoryValidation, createCategory);

router.put('/:id', authenticate, authorize('admin', 'editor'), categoryValidation, updateCategory);

router.delete('/:id', authenticate, authorize('admin', 'editor'), deleteCategory);

module.exports = router;