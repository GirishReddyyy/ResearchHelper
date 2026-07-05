const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    path: { type: String, required: true }, // e.g., '/AI Research/2024'
    parentPath: { type: String, default: '/' }, // e.g., '/AI Research'
    color: { type: String, default: '#3B82F6' },
    icon: { type: String, default: 'folder' },
  },
  { timestamps: true }
);

folderSchema.index({ user: 1, path: 1 }, { unique: true });
folderSchema.index({ user: 1, parentPath: 1 });

module.exports = mongoose.model('Folder', folderSchema);
