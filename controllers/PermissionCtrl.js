const Permission = require("../models/PermissionModel")
const User = require("../models/UserModel")

let PermissionCtrl = {
    create: async (req, res) => {
        try {
            let {
                requester_id,
                description,
                date,
                leave_time,
                return_time,
            } = req.body

            // Validate required fields
            if (!requester_id || !description) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Requester ID and description are required" 
                })
            }

            // Check if requester exists
            const requester = await User.findById(requester_id)
            if (!requester) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Requester not found" 
                })
            }

            let permission = new Permission({
                description,
                date: date || Date.now(),
                leave_time,
                return_time,
                status: 'pending', // Better than 'in progress'
                requester: requester_id,
            })
            await permission.save()

            // Populate the requester data for response
            await permission.populate('requester', 'username fullname email role')

            return res.status(201).json({ success: true, data: permission })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },
    
    all: async (req, res) => {
        try {
            let permissions = await Permission.find()
                .populate('requester', 'username fullname email role')
                .populate('supervisor', 'username fullname email role')
                .populate('assistant', 'username fullname email role')
                .sort({ createdAt: -1 }) // Latest first
            
            return res.status(200).json({ success: true, data: permissions })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },
    
    get_one: async (req, res) => {
        try {
            let { id } = req.params
            
            let permission = await Permission.findById(id)
                .populate('requester', 'username fullname email role')
                .populate('supervisor', 'username fullname email role')
                .populate('assistant', 'username fullname email role')
            
            if (!permission) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Permission request not found" 
                })
            }
            
            return res.status(200).json({ success: true, data: permission })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },
    
    edit: async (req, res) => {
        try {
            let { id } = req.params
            let { user_id, comment, status } = req.body

            // Validate inputs
            if (!user_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: "User ID is required" 
                })
            }

            // Find permission and user
            let permission = await Permission.findById(id)
            let user = await User.findById({ _id: user_id })

            if (!permission) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Permission request not found" 
                })
            }

            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: "User not found" 
                })
            }

            let updatedPermission

            // Handle assistant review (pending -> under_review)
            if (permission.status === 'pending' && user.role === 'assistant') {
                updatedPermission = await Permission.findByIdAndUpdate(
                    id, 
                    {
                        assistant: user._id,
                        assistant_comment: comment,
                        status: 'under_review' // Assistant has reviewed, waiting for supervisor
                    },
                    { new: true } // Return updated document
                )
            }
            // Handle supervisor decision (under_review -> accepted/rejected)
            else if (permission.status === 'under_review' && user.role === 'supervisor') {
                // Validate status is provided
                if (!status || (status !== 'accepted' && status !== 'rejected')) {
                    return res.status(400).json({ 
                        success: false, 
                        message: "Status must be 'accepted' or 'rejected'" 
                    })
                }

                updatedPermission = await Permission.findByIdAndUpdate(
                    id, 
                    {
                        supervisor: user._id,
                        supervisor_comment: comment,
                        status: status // 'accepted' or 'rejected'
                    },
                    { new: true }
                )
            }
            else {
                return res.status(400).json({ 
                    success: false, 
                    message: `Cannot update permission with status '${permission.status}' as user role '${user.role}'` 
                })
            }

            // Populate user data for response
            await updatedPermission.populate(['requester', 'supervisor', 'assistant'])

            return res.status(200).json({ success: true, data: updatedPermission })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },
    
    delete: async (req, res) => {
        try {
            let { id } = req.params
            let permission = await Permission.findByIdAndDelete(id)
            
            if (!permission) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Permission request not found" 
                })
            }
            
            return res.status(200).json({ 
                success: true, 
                message: "Permission request deleted successfully",
                data: permission 
            })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },
    
    // Additional useful methods
    getUserPermissions: async (req, res) => {
        try {
            let { user_id } = req.params
            
            let permissions = await Permission.find({
                $or: [
                    { requester: user_id },
                    { assistant: user_id },
                    { supervisor: user_id }
                ]
            })
            .populate('requester', 'username fullname email role')
            .populate('supervisor', 'username fullname email role')
            .populate('assistant', 'username fullname email role')
            .sort({ createdAt: -1 })
            
            return res.status(200).json({ success: true, data: permissions })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    }
}

module.exports = PermissionCtrl // Fixed export












// const Permission = require("../models/PermissionModel")
// const User = require("../models/UserModel")

// let PermissionCtrl = {
//     create: async (req, res) => {
//         try {
//             let {
//                 requester_id,
//                 description,
//                 date,
//                 leave_time,
//                 return_time,
//             } = req.body

//             let permission = new Permission({
//                 description,
//                 date,
//                 leave_time,
//                 return_time,
//                 status: 'in progress',
//                 requester: requester_id,
//             })
//             await permission.save()

//             return res.status(200).json({ success: true, data: permission })
//         } catch (error) {
//             return res.status(500).json({ success: false, message: error.message })
//         }
//     },
//     all: async (req, res) => {
//         try {
//             let permissions = await Permission.find()
            
//             return res.status(200).json({ success: true, data: permissions })
//         } catch (error) {
//             return res.status(500).json({ success: false, message: error.message })
//         }
//     },
//     get_one: async (req, res) => {
//         try {
//             let { id } = req.params
//             let permission = await Permission.findById({ _id: id })
            
//             return res.status(200).json({ success: true, data: permission })
//         } catch (error) {
//             return res.status(500).json({ success: false, message: error.message })
//         }
//     },
//     edit: async (req, res) => {
//         try {
//             let { id } = req.params
//             let { user_id, comment, status } = req.body
//             let permission = await Permission.findById({ _id: id })
//             let user = await User.findById({ _id: user_id })

//             if(permission.status === 'in progress' && user.role !== 'assistant') return res.status(500).json({ success: false, message: 'The permission should pass by the assistant first!' })
//             if(permission.status === 'in progress' && user.role === 'assistant') {
//                 permission = await Permission.findByIdAndUpdate({ _id: id }, {
//                     assistant: user._id,
//                     assistant_comment: comment,
//                     status: 'assistant' // read by the assistant, so now can the supervisor accept it or not
//                 })
//             }
//             else if(permission.status === 'assistant' && user.role === 'supervisor') {
//                 permission = await Permission.findByIdAndUpdate({ _id: id }, {
//                     supervisor: user._id,
//                     supervisor_comment: comment,
//                     status: status // accepted | not accepted
//                 })
//             }
            
//             return res.status(200).json({ success: true, data: permission })
//         } catch (error) {
//             return res.status(500).json({ success: false, message: error.message })
//         }
//     },
//     delete: async (req, res) => {
//         try {
//             let { id } = req.params
//             let permission = await Permission.findByIdAndDelete({ _id: id })
//             return res.status(200).json({ success: true, data: permission })
//         } catch (error) {
//             return res.status(500).json({ success: false, message: error.message })
//         }
//     },
// }

// module.exports = PermissionCtrl