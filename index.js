require('dotenv').config()
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connection = require('./database/connection');

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(cookieParser())

app.use('/api/user', require('./routes/UserRoutes'))
app.use('/api/request', require('./routes/RequestRoutes'))
app.use('/api/permission', require('./routes/PermissionRoutes'))
app.use('/api/material', require('./routes/MaterialsRoutes'))

app.get('/', (req, res) => {
    try {
        return res.status(200).json({ success: true, message: 'hello world!' })
    } catch(error) {
        return res.status(500).json({ success: false, message: error })
    }
})
connection()

let PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`Server is listening on port: http://localhost:${PORT}`))