const WeeklyTop = require('../models/WeeklyTopModel')

const WeeklyTopCtrl = {
    // GET /api/weeklytop — public (any logged-in user)
    get: async (req, res) => {
        try {
            const doc = await WeeklyTop.findOne()
                .sort({ createdAt: -1 })
                .populate('workers.user', 'fullname username role avatar')
            return res.status(200).json({ success: true, data: doc })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },

    // POST /api/weeklytop — admin only
    set: async (req, res) => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'غير مصرح' })
            }

            const { workers, weekLabel } = req.body
            // workers: [{ rank, userId }]
            if (!workers || workers.length !== 3) {
                return res.status(400).json({ success: false, message: 'يجب اختيار 3 فنيين' })
            }

            const formatted = workers.map(w => ({ rank: w.rank, user: w.userId }))

            // Replace the single document (upsert)
            let doc = await WeeklyTop.findOne()
            if (doc) {
                doc.workers = formatted
                doc.weekLabel = weekLabel || ''
                doc.setBy = req.user.id
                await doc.save()
            } else {
                doc = await WeeklyTop.create({
                    workers: formatted,
                    weekLabel: weekLabel || '',
                    setBy: req.user.id,
                })
            }

            await doc.populate('workers.user', 'fullname username role avatar')
            return res.status(200).json({ success: true, data: doc })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },
}

module.exports = WeeklyTopCtrl
