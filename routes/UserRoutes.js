const router = require('express').Router()
const UserCtrl = require('../controllers/UserCtrl')
const adminAuth = require('../middleware/adminAuth')
const auth = require('../middleware/auth')

router.post('/register', UserCtrl.register)
router.post('/login', UserCtrl.login)
router.get('/refreshtoken', UserCtrl.refreshtoken)
router.get('/logout', UserCtrl.logout)
router.get('/userinfo', auth, UserCtrl.userInfo)
router.get('/all', auth, adminAuth, UserCtrl.all)
router.get('/:role', auth, UserCtrl.getUsers)
router.get('/users/waiting', auth, UserCtrl.getNewUsers)
router.get('/users/active-users', auth, UserCtrl.getActiveUser)

router.put('/accept/:id', auth, adminAuth, UserCtrl.accept_user)
router.put('/edit/:id', auth, adminAuth, UserCtrl.edit_user)
router.delete('/delete/:id', auth, adminAuth, UserCtrl.remove)

module.exports = router