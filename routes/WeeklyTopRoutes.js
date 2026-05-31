const router = require('express').Router()
const auth = require('../middleware/auth')
const WeeklyTopCtrl = require('../controllers/WeeklyTopCtrl')

router.get('/', auth, WeeklyTopCtrl.get)
router.post('/', auth, WeeklyTopCtrl.set)

module.exports = router
