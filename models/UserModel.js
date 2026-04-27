const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, 'This name is already taken. Please choose another one!'],
        required: [true, 'Please enter your username']
    },
    fullname: {
        type: String,
        unique: [true, 'This fullname is already taken. Please choose another one!'],
        required: [true, 'Please enter your fullname']
    },
    email: {
        type: String,
        required: false,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please enter the password']
    },
    role: {
        type: String,
        required: [true, 'Please choose a role']
    },
    status: {
        type: String,
        default: 'waiting'
    },
}, {
    timestamps: true
})

const User = mongoose.model('User', UserSchema)
module.exports = User