const router = require('express').Router();
const WorkTimeCtrl = require('../controllers/WorkTimeCtrl');
const auth = require('../middleware/auth');

router.get('/status', auth, WorkTimeCtrl.getStatus);
router.post('/toggle', auth, WorkTimeCtrl.toggle);

module.exports = router;
