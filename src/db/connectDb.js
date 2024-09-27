import mongoose from "mongoose"
import { databaseName } from "../constants.js"

export default async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${databaseName}`)
        console.log('MongoDB connected', 'DB Host', connectionInstance.connection.host)
    } catch (error) {
     console.log("MongoDB connection error ",error)   
    }
}