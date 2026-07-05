const router = require('express').Router();
const { listPapers, getPaper, deletePaper } = require('../controllers/paperController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', listPapers);
router.get('/:id', getPaper);
router.delete('/:id', deletePaper);

module.exports = router;
