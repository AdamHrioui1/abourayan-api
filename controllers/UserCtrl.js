const User = require("../models/UserModel")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const UserCtrl = {
    register: async (req, res) => {
        try {
            const { username, fullname, email, password, role } = req.body
            
            if(username.length < 3) return res.status(400).json({ success: false, message: "Le nom doit comporter au moins 3 caractères !"}) 
            if(fullname.length < 3) return res.status(400).json({ success: false, message: "Le nom de famille doit comporter au moins 3 caractères !"})
            if(password.length < 6) return res.status(400).json({ success: false, message: 'Veuillez saisir un mot de passe d’au moins 6 caractères !'}) 
            
            const user = await User.findOne({ username: username })
            if(user) return res.status(400).json({ success: false, message: "This name is already taken. Please choose another one!"})
            
            const salt = 10
            const hashedPassword = await bcrypt.hash(password, salt)
            const newUser = new User({
                username, fullname, email, password: hashedPassword, role
            })

            await newUser.save()
            const accessToken = createAccessToken({ id: newUser._id, role: newUser.role })
            const refreshtoken = createRefreshToken({ id: newUser._id, role: newUser.role })

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/api/user/refreshtoken'
            })

            return res.status(200).json({ success: true, data: newUser })
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message })
        }
    },
    login: async (req, res) => {
        try {
            const { username, password } = req.body

            const user = await User.findOne({ username: username })
            if(!user) return res.status(400).json({ success: false, message: "User not found!" })
            if(password.length < 6) return res.status(400).json({ success: false, message: "Enter your password at least 6 characters !"})
            if(user.status !== 'accepted') return res.status(400).json({ success: false, message: 'You need to get accepted by the admin' })
            
            const isMatch = await bcrypt.compare(password, user.password)
            if(!isMatch) return res.status(400).json({ success: false, message: 'Incorrect Password!!' })

            const accesstoken = createAccessToken({ id: user._id })
            const refreshtoken = createRefreshToken({ id: user._id })

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/api/user/refreshtoken'
            })

            return res.status(200).json({ success: true, accesstoken, data: user })            
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message })
        }
    },
    refreshtoken: async (req, res) => {
        try {
            const token = req.cookies.refreshtoken
            if(!token) return res.status(400).json({ success: false, message: 'Invalid Authentication!' })
            jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if(err) return res.status(400).json({ success: false, message: 'Invalid Authentication!'})

                const accesstoken = createAccessToken({ id: user.id })
                return res.status(200).json({ success: true, accesstoken })
            })
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message })
        }
    },
    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', { path: '/api/user/refreshtoken' })
            res.status(200).json({ success: true, message: 'Logout successfult!'})
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message })
        }
    },
    userInfo: async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-password')
            return res.json({ success: true, data: user })
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message })
        }
    },
    all: async (req, res) => {
        try {
            const users = await User.find().select('-password')
            return res.json({ success: true, data: users })
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message })
        }
    },
    
    getUsers: async (req, res) => {
        try {
            let { role } = req.params
            let users = await User.find({ role: role, status: 'accepted' })
            return res.status(200).json({ success: true, data: users });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    // getAdmins: async (req, res) => {
    //     try {
    //         let users = await User.find({ role: 'admin', status: 'accepted' })
    //         return res.status(200).json({ success: true, data: users });
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: error.message });
    //     }
    // },
    // getSupervisors: async (req, res) => {
    //     try {
    //         let users = await User.find({ role: 'supervisor', status: 'accepted' })
    //         return res.status(200).json({ success: true, data: users });
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: error.message });
    //     }
    // },
    // getAssistants: async (req, res) => {
    //     try {
    //         let users = await User.find({ role: 'assistant', status: 'accepted' })
    //         return res.status(200).json({ success: true, data: users });
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: error.message });
    //     }
    // },
    // getTechnicians: async (req, res) => {
    //     try {
    //         let users = await User.find({ role: 'technician', status: 'accepted' })
    //         return res.status(200).json({ success: true, data: users });
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: error.message });
    //     }
    // },
    // getRequesters: async (req, res) => {
    //     try {
    //         let users = await User.find({ role: 'requester', status: 'accepted' })
    //         return res.status(200).json({ success: true, data: users });
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: error.message });
    //     }
    // },

    getNewUsers: async (req, res) => {
        try {
            // Try multiple possible status values
            let users = await User.find({ 
                $or: [
                    { status: 'Waiting' },
                    { status: 'waiting' },
                    { status: 'pending' },
                    { status: null } // Check if status is null
                ]
            });
            
            // If still empty, return all users for debugging
            if (users.length === 0) {
                const allUsers = await User.find().select('username status');
                console.log('All users in DB:', allUsers);
                return res.status(200).json({ 
                    success: true, 
                    data: [],
                    debug: allUsers // Include debug info
                });
            }
            
            return res.status(200).json({ success: true, data: users });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    getActiveUser: async (req, res) => {
        try {
            let users = await User.find({ status: 'accepted' })
            return res.status(200).json({ success: true, data: users })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },

    remove: async (req, res) => {
        try {
            let { id } = req.params
            const user = await User.findByIdAndDelete({ _id: id })
            return res.json({ success: true, data: user })
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message })
        }
    },
    accept_user: async (req, res) => {
        try {
            let { id } = req.params
            let { status } = req.body
            const user = await User.findByIdAndUpdate({ _id: id }, {
                status: status
            })
            return res.json({ success: true, data: user })
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message })
        }
    },
    edit_user: async (req, res) => {
        try {
            let { id } = req.params
            
            const { username, fullname, email, password, role, status } = req.body
            
            if(username.length < 3) return res.status(400).json({ success: false, message: "Le nom doit comporter au moins 3 caractères !"}) 
            if(fullname.length < 3) return res.status(400).json({ success: false, message: "Le nom de famille doit comporter au moins 3 caractères !"}) 
            if(password.length < 6) return res.status(400).json({ success: false, message: 'Veuillez saisir un mot de passe d’au moins 6 caractères !'}) 
            
            const salt = 10
            const hashedPassword = await bcrypt.hash(password, salt)
            let updatedUser = await User.findByIdAndUpdate({ _id: id }, {
                username, fullname, email, password: hashedPassword, role,
                status: status
            })
            
            return res.status(200).json({ success: true, data: updatedUser })
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message })
        }
    },
}

const createAccessToken = (id) => {
    return jwt.sign(id, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
}

const createRefreshToken = (id) => {
    return jwt.sign(id, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })
}

module.exports = UserCtrl