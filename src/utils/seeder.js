const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Post = require('../models/Post');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    const admin = new User({
      username: 'admin',
      email: 'admin@cms.local',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@cms.local');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

const seedCategories = async () => {
  try {
    const categoriesCount = await Category.countDocuments();
    if (categoriesCount > 0) {
      console.log('Categories already exist');
      return;
    }

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Admin user not found. Please seed admin first.');
      return;
    }

    const categories = [
      {
        name: 'Technology',
        description: 'Latest tech trends and innovations',
        color: '#3B82F6',
        createdBy: admin._id
      },
      {
        name: 'Lifestyle',
        description: 'Tips for better living',
        color: '#10B981',
        createdBy: admin._id
      },
      {
        name: 'Business',
        description: 'Business insights and strategies',
        color: '#F59E0B',
        createdBy: admin._id
      },
      {
        name: 'Health',
        description: 'Health and wellness topics',
        color: '#EF4444',
        createdBy: admin._id
      }
    ];

    await Category.insertMany(categories);
    console.log('Sample categories created successfully');
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
};

const seedPosts = async () => {
  try {
    const postsCount = await Post.countDocuments();
    if (postsCount > 0) {
      console.log('Posts already exist');
      return;
    }

    const admin = await User.findOne({ role: 'admin' });
    const techCategory = await Category.findOne({ name: 'Technology' });

    if (!admin || !techCategory) {
      console.log('Admin user or Technology category not found. Please seed them first.');
      return;
    }

    const posts = [
      {
        title: 'Welcome to Your New CMS',
        content: `
          <h2>Getting Started</h2>
          <p>Welcome to your new Content Management System! This CMS is built with Node.js, Express, and MongoDB, providing you with a powerful and flexible platform for managing your content.</p>

          <h3>Key Features</h3>
          <ul>
            <li>User authentication and role-based access control</li>
            <li>Post and category management</li>
            <li>Media library with file uploads</li>
            <li>Dashboard with analytics</li>
            <li>Search and pagination</li>
            <li>SEO optimization</li>
          </ul>

          <h3>Getting Started</h3>
          <p>To start using your CMS:</p>
          <ol>
            <li>Log in with your admin credentials</li>
            <li>Create some categories for organizing your content</li>
            <li>Start writing your first post</li>
            <li>Upload media files to enhance your content</li>
            <li>Monitor your site's performance through the dashboard</li>
          </ol>

          <p>Happy blogging!</p>
        `,
        excerpt: 'Learn how to get started with your new CMS and explore its powerful features.',
        status: 'published',
        category: techCategory._id,
        author: admin._id,
        tags: ['cms', 'getting-started', 'tutorial'],
        isFeatured: true,
        seoTitle: 'Welcome to Your New CMS - Getting Started Guide',
        seoDescription: 'Complete guide to getting started with your new Node.js CMS. Learn about features, setup, and best practices.',
        publishedAt: new Date()
      },
      {
        title: 'Understanding Content Management',
        content: `
          <h2>What is Content Management?</h2>
          <p>Content management is the process of creating, editing, organizing, and publishing digital content. A good CMS makes this process seamless and efficient.</p>

          <h3>Best Practices</h3>
          <ul>
            <li>Keep your content organized with categories and tags</li>
            <li>Write compelling titles and meta descriptions</li>
            <li>Use high-quality images and media</li>
            <li>Maintain consistent publishing schedules</li>
            <li>Optimize for search engines</li>
          </ul>

          <p>This CMS provides all the tools you need to implement these best practices effectively.</p>
        `,
        excerpt: 'Learn the fundamentals of content management and best practices for success.',
        status: 'published',
        category: techCategory._id,
        author: admin._id,
        tags: ['content-management', 'best-practices'],
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      }
    ];

    await Post.insertMany(posts);
    console.log('Sample posts created successfully');
  } catch (error) {
    console.error('Error seeding posts:', error);
  }
};

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    await seedAdmin();
    await seedCategories();
    await seedPosts();

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
};

module.exports = {
  seedDatabase,
  seedAdmin,
  seedCategories,
  seedPosts
};