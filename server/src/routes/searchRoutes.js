const router = require('express').Router();
const { startSearch, getSearchStatus, getSearchResults, getSearchHistory, deleteSearch } = require('../controllers/searchController');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/', startSearch);
router.get('/history', getSearchHistory);
router.get('/:id', getSearchResults);
router.get('/:id/status', getSearchStatus);
router.delete('/:id', deleteSearch);

module.exports = router;
