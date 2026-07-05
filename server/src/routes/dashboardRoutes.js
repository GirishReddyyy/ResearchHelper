const router = require('express').Router();
const { getStats, getApiUsage, getTopSources } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/stats', getStats);
router.get('/api-usage', getApiUsage);
router.get('/top-sources', getTopSources);

module.exports = router;
