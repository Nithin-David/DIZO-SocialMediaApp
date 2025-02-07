import mongoose from "mongoose";

export const connectMongoDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log("mongoDB connected:" + conn.connection.host);

    } catch (error) {
        console.log("mongo connection error: " + error.message);
        process.exit(1);
    }
}