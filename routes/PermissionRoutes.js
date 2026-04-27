const router = require('express').Router()
const PermissionCtrl = require('../controllers/PermissionCtrl')
const adminAuth = require('../middleware/adminAuth')
const auth = require('../middleware/auth')

router.post('/create', auth, PermissionCtrl.create)
router.get('/all', auth, PermissionCtrl.all)
router.get('/:id', auth, PermissionCtrl.get_one)
router.put('/:id', auth, PermissionCtrl.edit)
router.delete('/:id', auth, PermissionCtrl.delete)

module.exports = router