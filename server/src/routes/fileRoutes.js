const router = require('express').Router();
const { getFileTree, createFolder, renameFolder, deleteFolder, moveReport, previewFile } = require('../controllers/fileController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', getFileTree);
router.post('/folders', createFolder);
router.put('/folders/:id', renameFolder);
router.delete('/folders/:id', deleteFolder);
router.put('/reports/:id/move', moveReport);
router.get('/reports/:id/preview/:format', previewFile);

module.exports = router;
