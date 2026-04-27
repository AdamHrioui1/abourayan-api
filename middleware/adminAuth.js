const jsonwebtoken = require("jsonwebtoken");
const User = require("../models/UserModel");

const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)

        if(user.role !== 'admin') {
            return res.status(400).json({ success: false, message: 'Page not allowed!'})
        }
        
        next()
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

module.exports = adminAuth