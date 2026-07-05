const router = require('express').Router();
const { generate, batchGenerate, exportBibTeX } = require('../controllers/citationController');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/generate', generate);
router.post('/batch', batchGenerate);
router.post('/bibtex', exportBibTeX);

module.exports = router;
