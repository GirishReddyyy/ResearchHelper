const router = require('express').Router();
const { getStats, listUsers, updateUser, deleteUser, getApiUsage } = require('../controllers/adminController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.use(auth, adminAuth);
router.get('/stats', getStats);
router.get('/users', listUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/api-usage', getApiUsage);

module.exports = router;
