import mongoose from "mongoose";
import {DB_NAME} from '../contants.js'

const dbConnection = async () => {   
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    }
    catch(error) {
        console.log('MongoDB Connection Failed', error);
    }
}

export default dbConnection;
