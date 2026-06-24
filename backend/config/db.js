// Imports
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Config
dotenv.config();

// Connection

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log('MongoDB connected');
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
};

// Exports
export default connectDB;
