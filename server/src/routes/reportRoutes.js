const router = require('express').Router();
const { createReport, listReports, getReport, updateReport, generateReport, downloadReport, deleteReport } = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/', createReport);
router.get('/', listReports);
router.get('/:id', getReport);
router.put('/:id', updateReport);
router.post('/:id/generate', generateReport);
router.get('/:id/download/:format', downloadReport);
router.delete('/:id', deleteReport);

module.exports = router;
