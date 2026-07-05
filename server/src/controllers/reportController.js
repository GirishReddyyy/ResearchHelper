const Report = require('../models/Report');
const { getQueue } = require('../config/bullmq');
const { downloadFromGridFS } = require('../services/gridfsService');
const mongoose = require('mongoose');

const createReport = async (req, res, next) => {
  try {
    const { title, topic, sections, paperIds, folder, tags } = req.body;
    const report = await Report.create({
      user: req.user._id,
      title,
      topic,
      sections: sections || [],
      papers: paperIds || [],
      folder: folder || '/',
      tags: tags || [],
    });
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

const listReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const folder = req.query.folder || null;

    const filter = { user: req.user._id };
    if (folder) filter.folder = folder;

    const reports = await Report.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-sections');

    const total = await Report.countDocuments(filter);
    res.json({ reports, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const getReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id })
      .populate('papers', 'title authors publicationYear doi');
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const { title, topic, sections, paperIds, folder, tags } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (topic) updates.topic = topic;
    if (sections) updates.sections = sections;
    if (paperIds) updates.papers = paperIds;
    if (folder !== undefined) updates.folder = folder;
    if (tags) updates.tags = tags;

    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

const generateReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const queue = getQueue('report');
    const job = await queue.add('generate', { reportId: report._id.toString() }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
    });

    report.jobId = job.id;
    report.status = 'generating';
    await report.save();

    res.status(202).json({ message: 'Report generation started.', jobId: job.id });
  } catch (error) {
    next(error);
  }
};

const downloadReport = async (req, res, next) => {
  try {
    const { format } = req.params;
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const file = report.files.find((f) => f.format === format);
    if (!file) return res.status(404).json({ error: `No ${format} file generated yet.` });

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);

    const stream = downloadFromGridFS(new mongoose.Types.ObjectId(file.gridfsId));
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // GridFS cleanup could be done here or in a worker
    res.json({ message: 'Report deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport, listReports, getReport, updateReport, generateReport, downloadReport, deleteReport };
