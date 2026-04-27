const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Please enter a description'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
    leave_time: {
        type: String,
    },
    return_time: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'under_review', 'accepted', 'rejected'], // Clear status options
        default: 'pending',
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // Should always have a requester
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    assistant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    assistant_comment: {
        type: String,
        default: null
    },
    supervisor_comment: {
        type: String,
        default: null
    },
}, {
    timestamps: true
})

const Permission = mongoose.model('Permission', PermissionSchema)
module.exports = Permission