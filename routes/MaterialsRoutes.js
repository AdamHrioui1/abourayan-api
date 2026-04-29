const router = require('express').Router()
const MaterialsCtrl = require('../controllers/MaterialsCtrl')
const adminAuth = require('../middleware/adminAuth')
const auth = require('../middleware/auth')

router.post('/create', auth, MaterialsCtrl.create)
router.get('/all/:role/:user_id', auth, MaterialsCtrl.all)
router.get('/:id', auth, MaterialsCtrl.get_one)
router.put('/:id', auth, MaterialsCtrl.edit)
router.delete('/:id', auth, MaterialsCtrl.delete)

module.exports = router