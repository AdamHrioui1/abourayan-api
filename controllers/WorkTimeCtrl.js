const WorkTime = require('../models/WorkTimeModel');

let WorkTimeCtrl = {
    getStatus: async (req, res) => {
        try {
            let settings = await WorkTime.findOne();
            if (!settings) {
                settings = await WorkTime.create({ isOpen: true });
            }
            return res.status(200).json({ success: true, isOpen: settings.isOpen });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    toggle: async (req, res) => {
        try {
            let settings = await WorkTime.findOne();
            if (!settings) {
                settings = await WorkTime.create({ isOpen: true });
            }
            settings.isOpen = !settings.isOpen;
            await settings.save();
            return res.status(200).json({ success: true, isOpen: settings.isOpen });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
};

module.exports = WorkTimeCtrl;
