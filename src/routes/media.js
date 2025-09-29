const express = require('express');
const { body } = require('express-validator');
const {
  uploadFile,
  uploadFiles,
  getMedia,
  getMediaItem,
  updateMedia,
  deleteMedia,
  getMediaStats
} = require('../controllers/mediaController');
const { authenticate, authorize, authorizeOwnershipOrAdmin } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');

const router = express.Router();

const mediaUpdateValidation = [
  body('alt')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Alt text cannot exceed 200 characters'),
  body('caption')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Caption cannot exceed 500 characters')
];

const checkMediaOwnership = async (req, res, next) => {
  try {
    const media = await require('../models/Media').findById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    req.resource = media;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

router.get('/', authenticate, getMedia);
router.get('/stats', authenticate, authorize('admin', 'editor'), getMediaStats);
router.get('/:id', authenticate, getMediaItem);

router.post('/upload',
  authenticate,
  authorize('admin', 'editor', 'author'),
  uploadSingle,
  handleUploadError,
  uploadFile
);

router.post('/upload-multiple',
  authenticate,
  authorize('admin', 'editor', 'author'),
  uploadMultiple,
  handleUploadError,
  uploadFiles
);

router.put('/:id',
  authenticate,
  checkMediaOwnership,
  authorizeOwnershipOrAdmin('uploadedBy'),
  mediaUpdateValidation,
  updateMedia
);

router.delete('/:id',
  authenticate,
  checkMediaOwnership,
  authorizeOwnershipOrAdmin('uploadedBy'),
  deleteMedia
);

module.exports = router;