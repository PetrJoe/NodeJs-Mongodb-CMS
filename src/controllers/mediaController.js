const path = require('path');
const fs = require('fs').promises;
const Media = require('../models/Media');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { alt, caption } = req.body;

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativePath = req.file.path.replace(process.cwd(), '');
    const url = `${baseUrl}${relativePath.replace(/\\/g, '/')}`;

    const media = new Media({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url,
      alt: alt || '',
      caption: caption || '',
      uploadedBy: req.user._id
    });

    await media.save();
    await media.populate('uploadedBy', 'username fullName');

    res.status(201).json({
      message: 'File uploaded successfully',
      media
    });
  } catch (error) {
    console.error('Upload file error:', error);

    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({ error: 'Server error during file upload' });
  }
};

const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedMedia = [];

    for (const file of req.files) {
      try {
        const relativePath = file.path.replace(process.cwd(), '');
        const url = `${baseUrl}${relativePath.replace(/\\/g, '/')}`;

        const media = new Media({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url,
          uploadedBy: req.user._id
        });

        await media.save();
        await media.populate('uploadedBy', 'username fullName');
        uploadedMedia.push(media);
      } catch (mediaError) {
        console.error('Error saving media:', mediaError);
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }

    res.status(201).json({
      message: `${uploadedMedia.length} files uploaded successfully`,
      media: uploadedMedia
    });
  } catch (error) {
    console.error('Upload files error:', error);

    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }

    res.status(500).json({ error: 'Server error during file upload' });
  }
};

const getMedia = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      search,
      uploadedBy,
      sort = '-createdAt'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { isActive: true };

    if (type) {
      const typeMap = {
        image: /^image\//,
        video: /^video\//,
        audio: /^audio\//,
        document: /^application\/|^text\//
      };

      if (typeMap[type]) {
        query.mimetype = { $regex: typeMap[type] };
      }
    }

    if (uploadedBy) {
      query.uploadedBy = uploadedBy;
    }

    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { alt: { $regex: search, $options: 'i' } },
        { caption: { $regex: search, $options: 'i' } }
      ];
    }

    const media = await Media.find(query)
      .populate('uploadedBy', 'username fullName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Media.countDocuments(query);

    res.json({
      media,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Server error fetching media' });
  }
};

const getMediaItem = async (req, res) => {
  try {
    const { id } = req.params;

    const media = await Media.findById(id)
      .populate('uploadedBy', 'username fullName avatar');

    if (!media || !media.isActive) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json({ media });
  } catch (error) {
    console.error('Get media item error:', error);
    res.status(500).json({ error: 'Server error fetching media' });
  }
};

const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { alt, caption } = req.body;

    const updateData = {};
    if (alt !== undefined) updateData.alt = alt;
    if (caption !== undefined) updateData.caption = caption;

    const media = await Media.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'username fullName');

    if (!media || !media.isActive) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json({
      message: 'Media updated successfully',
      media
    });
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({ error: 'Server error during media update' });
  }
};

const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const media = await Media.findById(id);

    if (!media || !media.isActive) {
      return res.status(404).json({ error: 'Media not found' });
    }

    media.isActive = false;
    await media.save();

    if (req.query.permanent === 'true') {
      try {
        await fs.unlink(media.path);
        await Media.findByIdAndDelete(id);
        res.json({ message: 'Media permanently deleted' });
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        res.json({ message: 'Media marked as deleted (file removal failed)' });
      }
    } else {
      res.json({ message: 'Media deleted successfully' });
    }
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Server error during media deletion' });
  }
};

const getMediaStats = async (req, res) => {
  try {
    const stats = await Media.aggregate([
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
          audioCount: {
            $sum: { $cond: [{ $regexMatch: { input: '$mimetype', regex: /^audio\// } }, 1, 0] }
          },
          documentCount: {
            $sum: { $cond: [{ $regexMatch: { input: '$mimetype', regex: /^(application\/|text\/)/ } }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalFiles: 0,
      totalSize: 0,
      imageCount: 0,
      videoCount: 0,
      audioCount: 0,
      documentCount: 0
    };

    res.json({ stats: result });
  } catch (error) {
    console.error('Get media stats error:', error);
    res.status(500).json({ error: 'Server error fetching media stats' });
  }
};

module.exports = {
  uploadFile,
  uploadFiles,
  getMedia,
  getMediaItem,
  updateMedia,
  deleteMedia,
  getMediaStats
};