const { validationResult } = require('express-validator');
const Category = require('../models/Category');
const Post = require('../models/Post');

const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryData = {
      ...req.body,
      createdBy: req.user._id
    };

    if (categoryData.parent) {
      const parentCategory = await Category.findById(categoryData.parent);
      if (!parentCategory) {
        return res.status(400).json({ error: 'Invalid parent category' });
      }
    }

    const category = new Category(categoryData);
    await category.save();
    await category.populate('createdBy', 'username fullName');
    await category.populate('parent', 'name slug');

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Server error during category creation' });
  }
};

const getCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      parent,
      isActive,
      includeEmpty = false
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    if (parent !== undefined) {
      query.parent = parent === 'null' ? null : parent;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    let categories = await Category.find(query)
      .populate('createdBy', 'username fullName')
      .populate('parent', 'name slug')
      .populate('postCount')
      .sort({ order: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (includeEmpty === 'false') {
      categories = categories.filter(cat => cat.postCount > 0);
    }

    const total = await Category.countDocuments(query);

    res.json({
      categories,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
};

const getCategoriesHierarchy = async (req, res) => {
  try {
    const { includeEmpty = false } = req.query;

    const buildHierarchy = async (parentId = null) => {
      const query = { parent: parentId, isActive: true };

      let categories = await Category.find(query)
        .populate('createdBy', 'username fullName')
        .populate('postCount')
        .sort({ order: 1, name: 1 });

      if (includeEmpty === 'false') {
        categories = categories.filter(cat => cat.postCount > 0);
      }

      const result = [];
      for (const category of categories) {
        const children = await buildHierarchy(category._id);
        result.push({
          ...category.toObject(),
          children
        });
      }

      return result;
    };

    const hierarchy = await buildHierarchy();

    res.json({ categories: hierarchy });
  } catch (error) {
    console.error('Get categories hierarchy error:', error);
    res.status(500).json({ error: 'Server error fetching categories hierarchy' });
  }
};

const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate('createdBy', 'username fullName')
      .populate('parent', 'name slug')
      .populate('children')
      .populate('postCount');

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Server error fetching category' });
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug })
      .populate('createdBy', 'username fullName')
      .populate('parent', 'name slug')
      .populate('children')
      .populate('postCount');

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({ error: 'Server error fetching category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.parent) {
      const parentCategory = await Category.findById(updateData.parent);
      if (!parentCategory) {
        return res.status(400).json({ error: 'Invalid parent category' });
      }

      if (updateData.parent === id) {
        return res.status(400).json({ error: 'Category cannot be its own parent' });
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'username fullName')
      .populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Server error during category update' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const postCount = await Post.countDocuments({ category: id });
    if (postCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        error: 'Category has associated posts. Use force=true to delete anyway.',
        postCount
      });
    }

    await category.deleteOne();

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Server error during category deletion' });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoriesHierarchy,
  getCategory,
  getCategoryBySlug,
  updateCategory,
  deleteCategory
};