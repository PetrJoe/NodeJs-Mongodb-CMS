const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  mimetype: {
    type: String,
    required: [true, 'MIME type is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  url: {
    type: String,
    required: [true, 'File URL is required']
  },
  alt: {
    type: String,
    maxlength: [200, 'Alt text cannot exceed 200 characters']
  },
  caption: {
    type: String,
    maxlength: [500, 'Caption cannot exceed 500 characters']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

mediaSchema.virtual('isImage').get(function() {
  return this.mimetype.startsWith('image/');
});

mediaSchema.virtual('isVideo').get(function() {
  return this.mimetype.startsWith('video/');
});

mediaSchema.virtual('isDocument').get(function() {
  return this.mimetype.startsWith('application/') || this.mimetype.startsWith('text/');
});

mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ mimetype: 1 });
mediaSchema.index({ isActive: 1 });
mediaSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Media', mediaSchema);