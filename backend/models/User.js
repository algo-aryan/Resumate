// Imports
import mongoose from 'mongoose';

// Schema
const userSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
});

// Exports
export default mongoose.model('User', userSchema);
