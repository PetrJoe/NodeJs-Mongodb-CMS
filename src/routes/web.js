const express = require('express');
const router = express.Router();

// Public pages
router.get('/', (req, res) => {
  res.render('public/home', {
    title: 'Home',
    layout: 'layouts/main'
  });
});

router.get('/blog', (req, res) => {
  res.render('public/blog', {
    title: 'Blog',
    layout: 'layouts/main'
  });
});

router.get('/blog/:slug', (req, res) => {
  res.render('public/post', {
    title: 'Post',
    layout: 'layouts/main',
    slug: req.params.slug
  });
});

router.get('/categories', (req, res) => {
  res.render('public/categories', {
    title: 'Categories',
    layout: 'layouts/main'
  });
});

router.get('/category/:slug', (req, res) => {
  res.render('public/category', {
    title: 'Category',
    layout: 'layouts/main',
    slug: req.params.slug
  });
});

// Auth pages
router.get('/auth/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/admin');
  }
  res.render('auth/login', {
    title: 'Login',
    layout: false
  });
});

router.get('/auth/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/admin');
  }
  res.render('auth/register', {
    title: 'Register',
    layout: false
  });
});

router.post('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Admin pages (require authentication)
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      req.flash('error', 'Access denied. Insufficient permissions.');
      return res.redirect('/admin');
    }
    next();
  };
};

router.get('/admin', requireAuth, (req, res) => {
  res.render('dashboard/index', {
    title: 'Dashboard',
    layout: 'layouts/admin'
  });
});

router.get('/admin/posts', requireAuth, (req, res) => {
  res.render('posts/list', {
    title: 'Posts',
    layout: 'layouts/admin'
  });
});

router.get('/admin/posts/create', requireAuth, (req, res) => {
  res.render('posts/create', {
    title: 'Create Post',
    layout: 'layouts/admin'
  });
});

router.get('/admin/posts/my', requireAuth, (req, res) => {
  res.render('posts/my-posts', {
    title: 'My Posts',
    layout: 'layouts/admin'
  });
});

router.get('/admin/posts/:id/edit', requireAuth, (req, res) => {
  res.render('posts/edit', {
    title: 'Edit Post',
    layout: 'layouts/admin',
    postId: req.params.id
  });
});

router.get('/admin/categories', requireAuth, requireRole('admin', 'editor'), (req, res) => {
  res.render('categories/list', {
    title: 'Categories',
    layout: 'layouts/admin'
  });
});

router.get('/admin/categories/create', requireAuth, requireRole('admin', 'editor'), (req, res) => {
  res.render('categories/create', {
    title: 'Create Category',
    layout: 'layouts/admin'
  });
});

router.get('/admin/categories/:id/edit', requireAuth, requireRole('admin', 'editor'), (req, res) => {
  res.render('categories/edit', {
    title: 'Edit Category',
    layout: 'layouts/admin',
    categoryId: req.params.id
  });
});

router.get('/admin/media', requireAuth, (req, res) => {
  res.render('media/library', {
    title: 'Media Library',
    layout: 'layouts/admin'
  });
});

router.get('/admin/users', requireAuth, requireRole('admin'), (req, res) => {
  res.render('admin/users', {
    title: 'Users',
    layout: 'layouts/admin'
  });
});

router.get('/admin/analytics', requireAuth, requireRole('admin', 'editor'), (req, res) => {
  res.render('admin/analytics', {
    title: 'Analytics',
    layout: 'layouts/admin'
  });
});

router.get('/profile', requireAuth, (req, res) => {
  res.render('auth/profile', {
    title: 'Profile',
    layout: 'layouts/admin'
  });
});

// Error pages
router.get('/errors/404', (req, res) => {
  res.render('errors/404', {
    title: 'Page Not Found',
    layout: 'layouts/main'
  });
});

module.exports = router;