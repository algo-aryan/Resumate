import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import multer from 'multer';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/application.js';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { readFile } from 'fs/promises';
import puppeteer from 'puppeteer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js'; // adjust the path if it's different
import TrackedInternship from './models/TrackedInternship.js';
import resumeRoutes from './routes/resume.js';dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE'] }));
app.use(express.json());

app.use('/api', resumeRoutes);

// Connect DB and Auth
connectDB();
app.use('/api', authRoutes);
app.use('/api', applicationRoutes);

// Track Internship Route
app.post('/api/track-internship', async (req, res) => {
 const { userId, title, company, link } = req.body;

 if (!userId || !title || !company || !link) {
 return res.status(400).json({ message: "Missing required fields" });
 }

 try {
 const newTrack = new TrackedInternship({
 userId,
 title,
 company,
 link
 });

 await newTrack.save();
 res.status(201).json({ message: "Internship tracked successfully" });
 } catch (err) {
 console.error("Track error:", err);
 res.status(500).json({ message: "Server error while tracking internship" });
 }
});

// Get All Tracked Internships for a User
app.get('/api/tracked-internships/:userId', async (req, res) => {
 try {
 const { userId } = req.params;
 const internships = await TrackedInternship.find({ userId }).sort({ trackedAt: -1 });
 res.status(200).json(internships);
 } catch (err) {
 console.error("Fetch error:", err);
 res.status(500).json({ message: "Failed to fetch tracked internships." });
 }
});

// Signup Route
app.post('/api/signup', async (req, res) => {
 const { name, email, password } = req.body;

 try {
 const existingUser = await User.findOne({ email });
 if (existingUser) {
 return res.status(400).json({ message: 'User already exists' });
 }

 const hashedPassword = await bcrypt.hash(password, 10);
 const newUser = new User({ name, email, password: hashedPassword });
 await newUser.save();

 res.status(201).json({ message: 'User created successfully' });
 } catch (err) {
 console.error('Signup error:', err);
 res.status(500).json({ message: 'Server error during signup' });
 }
});

// Untrack internship by ID
app.delete('/api/untrack-internship/:id', async (req, res) => {
 try {
 const { id } = req.params;
 const deleted = await TrackedInternship.findByIdAndDelete(id);

 if (!deleted) {
 return res.status(404).json({ message: 'Internship not found' });
 }

 res.status(200).json({ message: 'Internship untracked successfully' });
 } catch (err) {
 console.error("Untrack error:", err);
 res.status(500).json({ message: "Server error during untracking" });
 }
});


app.get('/api/import/github/:username', async (req, res) => {
 try {
 const data = await fetchGitHubProfile(req.params.username);
 res.status(200).json(data);
 } catch (err) {
 console.error("GitHub Import Error:", err);
 res.status(500).json({ error: "Failed to fetch GitHub data" });
 }
});




// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

app.use((req, res) => {
  console.log(`[DEBUG] Catch-all route hit for ${req.originalUrl}. Sending index.html from:`, path.join(__dirname, '../frontend/index.html'));
  res.sendFile(path.join(__dirname, '../frontend/index.html'), (err) => {
    if (err) {
      console.error("[DEBUG] Error sending index.html:", err);
      res.status(500).send("Server Error: Cannot find frontend/index.html. Are you sure the frontend folder was included in the Render build?");
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));