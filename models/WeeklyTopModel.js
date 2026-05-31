const mongoose = require('mongoose')

const WeeklyTopSchema = new mongoose.Schema({
    workers: [
        {
            rank: { type: Number, required: true }, // 1, 2, 3
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        }
    ],
    weekLabel: { type: String, default: '' }, // e.g. "الأسبوع الأول - مايو 2026"
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('WeeklyTop', WeeklyTopSchema)
