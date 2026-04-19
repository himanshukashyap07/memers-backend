import mongoose from 'mongoose';
import 'dotenv/config';

const DB_NAME: string = "memeApp";

const connectDB = async (): Promise<void> => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        
        if (connectionInstance) {
            console.log("Db connect successfully");
        }

    } catch (error) {
        console.log("mongodb connection error", error);
        process.exit(1);
    }
}

export default connectDB;