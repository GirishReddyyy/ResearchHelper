const Folder = require('../models/Folder');
const Report = require('../models/Report');
const { downloadFromGridFS } = require('../services/gridfsService');
const mongoose = require('mongoose');

const getFileTree = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [folders, reports] = await Promise.all([
      Folder.find({ user: userId }).sort({ path: 1 }),
      Report.find({ user: userId })
        .select('title folder status files tags createdAt updatedAt')
        .sort({ updatedAt: -1 }),
    ]);

    res.json({ folders, reports });
  } catch (error) {
    next(error);
  }
};

const createFolder = async (req, res, next) => {
  try {
    const { name, parentPath, color } = req.body;
    const parent = parentPath || '/';
    const path = parent === '/' ? `/${name}` : `${parent}/${name}`;

    const folder = await Folder.create({
      user: req.user._id,
      name,
      path,
      parentPath: parent,
      color: color || '#3B82F6',
    });

    res.status(201).json(folder);
  } catch (error) {
    next(error);
  }
};

const renameFolder = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, user: req.user._id });
    if (!folder) return res.status(404).json({ error: 'Folder not found.' });

    const oldPath = folder.path;
    const newPath = folder.parentPath === '/'
      ? `/${name}`
      : `${folder.parentPath}/${name}`;

    // Update this folder
    folder.name = name;
    folder.path = newPath;
    if (color) folder.color = color;
    await folder.save();

    // Update children folders with old path prefix
    await Folder.updateMany(
      { user: req.user._id, path: { $regex: `^${oldPath}/` } },
      [{ $set: { path: { $replaceOne: { input: '$path', find: oldPath, replacement: newPath } } } }]
    );

    // Update reports in old path
    await Report.updateMany(
      { user: req.user._id, folder: oldPath },
      { folder: newPath }
    );

    res.json(folder);
  } catch (error) {
    next(error);
  }
};

const deleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, user: req.user._id });
    if (!folder) return res.status(404).json({ error: 'Folder not found.' });

    // Move contained reports to root
    await Report.updateMany(
      { user: req.user._id, folder: folder.path },
      { folder: '/' }
    );

    // Delete child folders
    await Folder.deleteMany({
      user: req.user._id,
      path: { $regex: `^${folder.path}` },
    });

    res.json({ message: 'Folder deleted. Reports moved to root.' });
  } catch (error) {
    next(error);
  }
};

const moveReport = async (req, res, next) => {
  try {
    const { folder } = req.body;
    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { folder: folder || '/' },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

const previewFile = async (req, res, next) => {
  try {
    const { format } = req.params;
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const file = report.files.find((f) => f.format === format);
    if (!file) return res.status(404).json({ error: 'File not found.' });

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);

    const stream = downloadFromGridFS(new mongoose.Types.ObjectId(file.gridfsId));
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = { getFileTree, createFolder, renameFolder, deleteFolder, moveReport, previewFile };
