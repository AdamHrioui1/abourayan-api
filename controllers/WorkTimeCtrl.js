// controllers/WorkTimeCtrl.js
const WorkTime = require("../models/WorkTimeModel");

let WorkTimeCtrl = {
    // Get current work settings
    getSettings: async (req, res) => {
        try {
            let settings = await WorkTime.findOne({ isActive: true });
            if (!settings) {
                // Return default settings if none exist
                settings = {
                    workDays: [1, 2, 3, 4],
                    startTime: '08:00',
                    endTime: '17:00',
                    isActive: true
                };
            }
            return res.status(200).json({ success: true, data: settings });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Create or update work settings
    updateSettings: async (req, res) => {
        try {
            let { workDays, startTime, endTime, breakStartTime, breakEndTime, holidays, specialWorkDays } = req.body;
            
            // Validate times
            if (startTime && endTime && startTime >= endTime) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Start time must be before end time" 
                });
            }
            
            if (breakStartTime && breakEndTime && breakStartTime >= breakEndTime) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Break start time must be before break end time" 
                });
            }
            
            // Deactivate old settings
            await WorkTime.updateMany({}, { isActive: false });
            
            // Create new settings
            let settings = new WorkTime({
                workDays,
                startTime,
                endTime,
                breakStartTime: breakStartTime || null,
                breakEndTime: breakEndTime || null,
                holidays: holidays || [],
                specialWorkDays: specialWorkDays || [],
                createdBy: req.user.id,
                isActive: true
            });
            
            await settings.save();
            
            return res.status(200).json({ success: true, data: settings });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Add holiday
    addHoliday: async (req, res) => {
        try {
            let { date, description } = req.body;
            let settings = await WorkTime.findOne({ isActive: true });
            
            if (!settings) {
                return res.status(404).json({ success: false, message: "Settings not found" });
            }
            
            settings.holidays.push({ date: new Date(date), description });
            await settings.save();
            
            return res.status(200).json({ success: true, data: settings });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Remove holiday
    removeHoliday: async (req, res) => {
        try {
            let { holidayId } = req.params;
            let settings = await WorkTime.findOne({ isActive: true });
            
            if (!settings) {
                return res.status(404).json({ success: false, message: "Settings not found" });
            }
            
            settings.holidays = settings.holidays.filter(h => h._id.toString() !== holidayId);
            await settings.save();
            
            return res.status(200).json({ success: true, data: settings });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Check if current time is working time
    checkWorkingTime: async (req, res) => {
        try {
            const isWorking = await WorkTime.isWorkingTime(new Date());
            const nextWorkingTime = !isWorking ? await WorkTime.getNextWorkingTime() : null;
            
            return res.status(200).json({ 
                success: true, 
                isWorking,
                nextWorkingTime: nextWorkingTime ? nextWorkingTime.toISOString() : null
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = WorkTimeCtrl;