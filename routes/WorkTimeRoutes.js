// routes/WorkTimeRoutes.js
const router = require('express').Router();
const WorkTimeCtrl = require('../controllers/WorkTimeCtrl');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/settings', auth, WorkTimeCtrl.getSettings);
router.put('/settings', auth, WorkTimeCtrl.updateSettings);
router.post('/holiday', auth, WorkTimeCtrl.addHoliday);
router.delete('/holiday/:holidayId', auth, WorkTimeCtrl.removeHoliday);
router.get('/check', auth, WorkTimeCtrl.checkWorkingTime);

module.exports = router;