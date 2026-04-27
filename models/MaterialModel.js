const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
    stock_number: {
        type: String,
    },
    description: {
        type: String,
    },
    quantity: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
})

const Materials = mongoose.model('Materials', MaterialSchema)
module.exports = Materials