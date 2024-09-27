import dotenv from 'dotenv/config'
import connectDb from './db/connectDb.js';
import { app } from './app.js';

app.get('/', (req, res) => {
    res.send('Welcome to home page');
})

const PORT = process.env.PORT || 3000
connectDb()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        })
        app.on('error', () => {
            console.log("Error occured while listening app")
        })
    })
    .catch((err) => {
        console.log("DB connection error", err)
    })