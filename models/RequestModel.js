const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please enter a title!'],
    },
    description: {
        type: String,
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    location: {
        type: String,
    },
    type: {
        type: String,
    },
    priority: {
        type: String,
    },
    status: {
        type: String,
        default: 'pending',
    },
    date: {
        type: Date,
        default: Date.now,
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
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: null,
        },
    }],
}, {
    timestamps: true
})

const Requests = mongoose.model('Requests', RequestSchema)
module.exports = Requests