const Materials = require("../models/MaterialModel")

let MaterialsCtrl = {
    create: async (req, res) => {
        try {
            let { user_id, stock_number, description, quantity } = req.body

            let material = new Materials({
                user: user_id, 
                stock_number, description, quantity
            })
            await material.save()
            return res.status(200).json({ success: true, data: material })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },
    all: async (req, res) => {
        try {
            let { role, user_id } = req.params
            let materials
            if(role === 'admin' || role === 'supervisor') {
                materials = await Materials.find().sort({ createdAt: -1 })
            } else {
                materials = await Materials.find({ user: user_id }).sort({ createdAt: -1 })
            }
            
            return res.status(200).json({ success: true, data: materials })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },
    get_one: async (req, res) => {
        try {
            let { id } = req.params
            let material = await Materials.findById(id)
            return res.status(200).json({ success: true, data: material })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },
    edit: async (req, res) => {
        try {
            let { id } = req.params
            let { stock_number, description, quantity } = req.body

            let material = await Materials.findByIdAndUpdate({ _id: id}, {
                stock_number, description, quantity
            })
            
            return res.status(200).json({ success: true, data: material })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },
    delete: async (req, res) => {
        try {
            let { id } = req.params
            let material = await Materials.findByIdAndDelete(id)
            
            return res.status(200).json({ success: true, data: material })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message })
        }
    },
}

module.exports = MaterialsCtrl