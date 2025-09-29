const Post = require('../models/Post');
const Category = require('../models/Category');
const User = require('../models/User');
const Media = require('../models/Media');

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      totalCategories,
      totalUsers,
      activeUsers,
      totalMedia,
      recentPosts,
      popularPosts,
      categoryStats,
      mediaStats,
      userStats
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ status: 'published' }),
      Post.countDocuments({ status: 'draft' }),
      Post.countDocuments({ status: 'archived' }),
      Category.countDocuments({ isActive: true }),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Media.countDocuments({ isActive: true }),

      Post.find({ status: 'published' })
        .populate('author', 'username fullName')
        .populate('category', 'name slug')
        .sort({ publishedAt: -1 })
        .limit(5)
        .select('title slug publishedAt views likes'),

      Post.find({ status: 'published' })
        .populate('author', 'username fullName')
        .populate('category', 'name slug')
        .sort({ views: -1 })
        .limit(5)
        .select('title slug publishedAt views likes'),

      Category.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'category',
            as: 'posts'
          }
        },
        {
          $addFields: {
            postCount: { $size: '$posts' }
          }
        },
        {
          $project: {
            name: 1,
            slug: 1,
            postCount: 1
          }
        },
        { $sort: { postCount: -1 } },
        { $limit: 10 }
      ]),

      Media.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalFiles: { $sum: 1 },
            totalSize: { $sum: '$size' },
            imageCount: {
              $sum: { $cond: [{ $regexMatch: { input: '$mimetype', regex: /^image\// } }, 1, 0] }
            },
            videoCount: {
              $sum: { $cond: [{ $regexMatch: { input: '$mimetype', regex: /^video\// } }, 1, 0] }
            },
            documentCount: {
              $sum: { $cond: [{ $regexMatch: { input: '$mimetype', regex: /^(application\/|text\/)/ } }, 1, 0] }
            }
          }
        }
      ]),

      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentPostsCount, recentUsersCount] = await Promise.all([
      Post.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    const postsGrowthTrend = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 30 }
    ]);

    res.json({
      stats: {
        posts: {
          total: totalPosts,
          published: publishedPosts,
          draft: draftPosts,
          archived: archivedPosts,
          recent: recentPostsCount
        },
        categories: {
          total: totalCategories
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          recent: recentUsersCount,
          byRole: userStats
        },
        media: {
          total: totalMedia,
          breakdown: mediaStats[0] || {
            totalFiles: 0,
            totalSize: 0,
            imageCount: 0,
            videoCount: 0,
            documentCount: 0
          }
        }
      },
      recentContent: {
        posts: recentPosts,
        popularPosts: popularPosts
      },
      analytics: {
        categoryStats: categoryStats,
        postsGrowthTrend: postsGrowthTrend
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard stats' });
  }
};

const getContentStats = async (req, res) => {
  try {
    const { userId } = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const baseQuery = isAdmin ? {} : { author: userId };

    const [
      userPosts,
      userDrafts,
      userPublished,
      userViews,
      userLikes,
      topPosts
    ] = await Promise.all([
      Post.countDocuments(baseQuery),
      Post.countDocuments({ ...baseQuery, status: 'draft' }),
      Post.countDocuments({ ...baseQuery, status: 'published' }),

      Post.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]),

      Post.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
      ]),

      Post.find(baseQuery)
        .populate('category', 'name slug')
        .sort({ views: -1 })
        .limit(5)
        .select('title slug views likes publishedAt')
    ]);

    res.json({
      userStats: {
        totalPosts: userPosts,
        drafts: userDrafts,
        published: userPublished,
        totalViews: userViews[0]?.totalViews || 0,
        totalLikes: userLikes[0]?.totalLikes || 0
      },
      topContent: {
        posts: topPosts
      }
    });
  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({ error: 'Server error fetching content stats' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { period = '30', type = 'posts' } = req.query;
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    let analytics = [];

    switch (type) {
      case 'posts':
        analytics = await Post.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        break;

      case 'users':
        analytics = await User.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        break;

      case 'media':
        analytics = await Media.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              isActive: true
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              count: { $sum: 1 },
              totalSize: { $sum: '$size' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        break;

      default:
        return res.status(400).json({ error: 'Invalid analytics type' });
    }

    const formattedAnalytics = analytics.map(item => ({
      date: new Date(item._id.year, item._id.month - 1, item._id.day),
      count: item.count,
      ...(type === 'media' && { totalSize: item.totalSize })
    }));

    res.json({
      analytics: formattedAnalytics,
      period: daysAgo,
      type
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
};

module.exports = {
  getDashboardStats,
  getContentStats,
  getAnalytics
};