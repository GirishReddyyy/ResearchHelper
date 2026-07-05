const router = require('express').Router();
const { checkAvailability, generateLiteratureReview, generateSummary, identifyTrends, identifyGaps, comparePapers } = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/status', checkAvailability);
router.post('/literature-review', generateLiteratureReview);
router.post('/summary', generateSummary);
router.post('/trends', identifyTrends);
router.post('/gaps', identifyGaps);
router.post('/compare', comparePapers);

module.exports = router;
