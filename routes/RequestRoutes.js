const router = require('express').Router()
const RequestCtrl = require('../controllers/RequestCtrl')
const adminAuth = require('../middleware/adminAuth')
const auth = require('../middleware/auth')

// STATIC routes (specific paths) FIRST
router.post('/create', auth, RequestCtrl.create)
router.get('/all', auth, RequestCtrl.get)
router.get('/search', auth, RequestCtrl.search)  // Important: before /:id
router.get('/user/:user_id', auth, RequestCtrl.getUserRequests)

// DYNAMIC routes (with parameters) LAST
router.get('/:id', auth, RequestCtrl.getById)
router.put('/:request_id', auth, RequestCtrl.edit)
router.put('/admin-supervisor/:request_id', auth, RequestCtrl.editRequestByAdminOrSupervisor)
router.delete('/:id', auth, RequestCtrl.delete)

module.exports = router