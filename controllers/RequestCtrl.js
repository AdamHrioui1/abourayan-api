const User = require("../models/UserModel");
const Requests = require("../models/RequestModel"); // ADD THIS IMPORT

let RequestCtrl = {
    create: async (req, res) => {
        try {
            let { title, description, requester, location, type, priority, status, date, supervisor, assistant, technician } = req.body;
            
            // Validate required fields
            if (!title || !requester) {
                return res.status(400).json({ success: false, message: "Title and requester are required" });
            }
            
            let newRequest = new Requests({
                title,
                description,
                requester,
                location,
                type,
                priority,
                status: status || 'pending', // Default if not provided
                date: date || Date.now(),
                supervisor: supervisor || null,
                assistant: assistant || null,
                technician: technician || null,
            });

            await newRequest.save();
            
            // Populate user fields for response
            await newRequest.populate(['requester', 'supervisor', 'assistant', 'technician']);
            
            return res.status(201).json({ success: true, data: newRequest });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    get: async (req, res) => {
        try {
            const [requests, statusStats, priorityStats] = await Promise.all([
                // Get all requests with populated fields
                Requests.find()
                    .populate('requester', 'username fullname email role')
                    .populate('supervisor', 'username fullname email role')
                    .populate('assistant', 'username fullname email role')
                    .populate('technician', 'username fullname email role')
                    .sort({ createdAt: -1 }),
                
                // Get all status counts at once
                Requests.aggregate([
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ]),
                
                // Get all priority counts at once
                Requests.aggregate([
                    {
                        $group: {
                            _id: '$priority',
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);
            
            // Convert status stats to object
            const statusCounts = {};
            statusStats.forEach(stat => {
                statusCounts[stat._id] = stat.count;
            });
            
            // Convert priority stats to object
            const priorityCounts = {};
            priorityStats.forEach(stat => {
                priorityCounts[stat._id] = stat.count;
            });
            
            return res.status(200).json({ 
                success: true, 
                data: requests,
                stats: {
                    status: {
                        pending: statusCounts.pending || 0,
                        in_progress: statusCounts.in_progress || 0,
                        completed: statusCounts.completed || 0,
                        rejected: statusCounts.rejected || 0,
                        total_active: (statusCounts.pending || 0) + (statusCounts.in_progress || 0)
                    },
                    priority: {
                        urgent: priorityCounts['عاجل'] || 0,
                        high: priorityCounts['مرتفع'] || 0,
                        medium: priorityCounts['متوسط'] || 0,
                        low: priorityCounts['منخفض'] || 0
                    },
                    total_requests: requests.length
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    // get: async (req, res) => {
    //     try {
    //         let requests = await Requests.find()
    //             .populate('requester', 'username fullname email role')
    //             .populate('supervisor', 'username fullname email role')
    //             .populate('assistant', 'username fullname email role')
    //             .populate('technician', 'username fullname email role')
    //             .sort({ createdAt: -1 }); // Latest first
            
    //         return res.status(200).json({ success: true, data: requests });
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: error.message });
    //     }
    // },
    // search: async (req, res) => {
    //     try {
    //         let { type, status, title } = req.query; // Use query params instead of body
            
    //         // Build search query dynamically
    //         let searchQuery = {};
            
    //         // Add conditions only if the parameter exists
    //         if (type && type !== '') {
    //             searchQuery.type = type;
    //         }
            
    //         if (status && status !== '') {
    //             searchQuery.status = status;
    //         }
            
    //         if (title && title !== '') {
    //             // For title, use regex for partial matching (case-insensitive)
    //             searchQuery.title = { $regex: title, $options: 'i' };
    //         }
            
    //         // If no search criteria provided, return all requests
    //         let requests = await Requests.find(searchQuery)
    //             .populate('requester', 'username fullname email role')
    //             .populate('supervisor', 'username fullname email role')
    //             .populate('assistant', 'username fullname email role')
    //             .populate('technician', 'username fullname email role')
    //             .sort({ createdAt: -1 });
            
    //         return res.status(200).json({ 
    //             success: true, 
    //             data: requests,
    //             count: requests.length,
    //             searchCriteria: searchQuery // Optional: return what was searched for
    //         });
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: error.message });
    //     }
    // },
    search: async (req, res) => {
        try {
            let { type, status, title } = req.query;
            
            // Build search query dynamically
            let searchQuery = {};
            
            // Map Arabic values to English database values
            const typeMap = {
                'جميع التصنيفات': null,
                'كهرباء': 'كهرباء',
                'سباكة': 'سباكة',
                'تكييف': 'تكييف',
                'مدني': 'مدني',
                'ميكانيكي': 'ميكانيكي',
                'اخرى': 'اخرى'
            };
            
            // const statusMap = {
            //     'جميع الحلات': null,
            //     'قيد الانتظار': 'pending',
            //     'لدى المشرف': 'with_supervisor',
            //     'لدى مساعد المشرف': 'with_assistant',
            //     'لدى الفني': 'with_technician',
            //     'قيد التنفيد': 'in_progress',
            //     'مكتمل': 'completed',
            //     'مرفوض': 'rejected'
            // };

            const statusMap = {
                'all': null,
                'pending': 'pending',
                'with_supervisor': 'with_supervisor',
                'with_assistant': 'with_assistant',
                'with_technician': 'with_technician',
                'in_progress': 'in_progress',
                'completed': 'completed',
                'rejected': 'rejected'
            };
            
            // Handle type filter
            if (type && type !== 'جميع التصنيفات' && type !== '') {
                searchQuery.type = type;
            }
            
            // Handle status filter
            if (status && status !== 'all' && status !== '') {
                const mappedStatus = statusMap[status];
                if (mappedStatus) {
                    searchQuery.status = mappedStatus;
                }
            }
            
            // Handle title search
            if (title && title.trim() !== '') {
                searchQuery.title = { $regex: title.trim(), $options: 'i' };
            }
            
            console.log('Search query:', searchQuery); // Debug log
            
            let requests = await Requests.find(searchQuery)
                .populate('requester', 'username fullname email role')
                .populate('supervisor', 'username fullname email role')
                .populate('assistant', 'username fullname email role')
                .populate('technician', 'username fullname email role')
                .sort({ createdAt: -1 });
            
            return res.status(200).json({ 
                success: true, 
                data: requests,
                count: requests.length 
            });
        } catch (error) {
            console.error('Search error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    
    getById: async (req, res) => { // Added this method
        try {
            let { id } = req.params;
            let request = await Requests.findById(id)
                .populate('requester', 'username fullname email role')
                .populate('supervisor', 'username fullname email role')
                .populate('assistant', 'username fullname email role')
                .populate('technician', 'username fullname email role');
            
            if (!request) {
                return res.status(404).json({ success: false, message: "Request not found" });
            }
            
            return res.status(200).json({ success: true, data: request });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    
    edit: async (req, res) => {
        try {
            let { request_id } = req.params; // Remove current_user_id from params
            let { current_user_id, next_user_id, in_progress_or_completed } = req.body; // Get current_user_id from body
            
            // Validate inputs
            if (!current_user_id) {
                return res.status(400).json({ success: false, message: "Current user ID is required" });
            }
            
            // Get all required data
            let current_user = await User.findById(current_user_id);
            let request = await Requests.findById(request_id);
            
            if (!current_user) {
                return res.status(404).json({ success: false, message: "Current user not found" });
            }
            
            if (!request) {
                return res.status(404).json({ success: false, message: "Request not found" });
            }
            
            let updatedRequest;
            
            // Handle different roles
            if (current_user.role === 'supervisor') {
                if (!next_user_id) {
                    return res.status(400).json({ success: false, message: "Next user ID is required" });
                }
                
                let next_user = await User.findById(next_user_id);
                if (!next_user || next_user.role !== 'assistant') {
                    return res.status(400).json({ success: false, message: "Next user must be an assistant" });
                }
                
                updatedRequest = await Requests.findByIdAndUpdate(
                    request_id, 
                    {
                        status: 'with_assistant',
                        supervisor: current_user_id,
                        assistant: next_user_id
                    },
                    { new: true } // Return updated document
                );
            }
            else if (current_user.role === 'assistant' && 
                current_user?._id.toString() === request.assistant?._id?.toString()) {
                console.log(current_user._id === request.assistant._id, current_user._id, request.assistant._id);
                if (!next_user_id) {
                    return res.status(400).json({ success: false, message: "Next user ID is required" });
                }
                
                let next_user = await User.findById(next_user_id);
                if (!next_user || next_user.role !== 'technician') {
                    return res.status(400).json({ success: false, message: "Next user must be a technician" });
                }
                
                updatedRequest = await Requests.findByIdAndUpdate(
                    request_id, 
                    {
                        status: 'with_technician',
                        assistant: current_user_id,
                        technician: next_user_id
                    },
                    { new: true }
                );
            }
            else if (current_user.role === 'technician' && 
                current_user?._id?.toString() === request.technician?._id?.toString()) {
                console.log(current_user._id === request.technician._id, current_user._id, request.technician._id);
                if (in_progress_or_completed === 'in_progress') {
                    updatedRequest = await Requests.findByIdAndUpdate(
                        request_id, 
                        {
                            status: 'in_progress' // Better than 'work on it'
                        },
                        { new: true }
                    );
                }
                else if (in_progress_or_completed === 'completed') {
                    updatedRequest = await Requests.findByIdAndUpdate(
                        request_id, 
                        {
                            status: 'completed' // Better than 'done'
                        },
                        { new: true }
                    );
                }
                else {
                    return res.status(400).json({ success: false, message: "Invalid action for technician" });
                }
            }
            else {
                return res.status(400).json({ success: false, message: "Invalid user role for this action" });
            }
            
            // Populate user fields for response
            await updatedRequest.populate(['requester', 'supervisor', 'assistant', 'technician']);
            
            return res.status(200).json({ success: true, data: updatedRequest });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    
    delete: async (req, res) => {
        try {
            let { id } = req.params;
            let request = await Requests.findByIdAndDelete(id);
            
            if (!request) {
                return res.status(404).json({ success: false, message: "Request not found" });
            }
            
            return res.status(200).json({ success: true, message: "Request deleted successfully", data: request });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Additional utility methods you might need
    getUserRequests: async (req, res) => {
        try {
            let { user_id } = req.params;
            
            let requests = await Requests.find({
                $or: [
                    { requester: user_id },
                    { supervisor: user_id },
                    { assistant: user_id },
                    { technician: user_id }
                ]
            }).populate('requester supervisor assistant technician', 'username fullname email role');
            
            return res.status(200).json({ success: true, data: requests });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = RequestCtrl;