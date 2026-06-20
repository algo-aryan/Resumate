import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
const { GlobalWorkerOptions } = pdfjsLib;
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
// Only import GoogleGenerativeAI directly. Error types are accessed via its instances or error.name/message.
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';

const router = express.Router();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add this exact line
GlobalWorkerOptions.standardFontDataUrl = path.resolve(
 __dirname,
 '../../node_modules/pdfjs-dist/standard_fonts/'
);


const upload = multer({ dest: 'uploads/' }); // Changed from backend/uploads/ to uploads/ for consistency

// Text extraction function
async function extractTextFromPDF(pdfPath) {
 const data = new Uint8Array(fs.readFileSync(pdfPath));
 const pdf = await pdfjsLib.getDocument({ data }).promise;

 let fullText = '';
 for (let i = 1; i <= pdf.numPages; i++) {
 const page = await pdf.getPage(i);
 const content = await page.getTextContent();
 const strings = content.items.map(item => item.str);
 fullText += strings.join(' ') + '\n';
 }

 return fullText.trim();
}

// Gemini ATS evaluation function
async function getATSScore(resumeText) {
 const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
 const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

 const prompt = `
You are an ATS bot. Given a resume, provide:
1. A numeric ATS score (0–100)
2. A brief summary
3. A list of strengths
4. A list of suggestions for improvement

Return response strictly in JSON format like this:

{
 "score": 85,
 "summary": "Brief summary of the candidate...",
 "strengths": ["Point 1", "Point 2"],
 "suggestions": ["Point 1", "Point 2"]
}

Resume:
"""${resumeText.slice(0, 12000)}"""
`;

 const result = await model.generateContent(prompt);
 return result.response.text();
}

// Main ATS score route
router.post('/ats-score', upload.single('resume'), async (req, res) => {
 // Define resumePath here so it's accessible in the finally block
 const resumePath = req.file ? path.resolve(__dirname, '../', req.file.path) : null; 
 const jobDescription = req.body.jobDescription;

 try {
 if (!resumePath) {
 return res.status(400).json({ error: "No resume file uploaded.", reason: "Please upload a PDF file." });
 }

 console.log("Received ATS score request");
 console.log("Uploaded file path:", resumePath);

 let geminiResponse;

 if (jobDescription && jobDescription.trim().length > 0) {
     console.log("Evaluating against provided Job Description using ats_matcher.py...");
     const pythonPath = 'python3';
     const scriptPath = path.resolve(__dirname, '../ats_matcher.py');
     
     geminiResponse = await new Promise((resolve, reject) => {
         const child = exec(`"${pythonPath}" "${scriptPath}" "${resumePath}"`, {
            env: { ...process.env }
         }, (err, stdout, stderr) => {
             if (err) {
                 console.error("ats_matcher.py execution error:", err);
                 console.error("ats_matcher.py stderr:", stderr);
                 reject(new Error(stdout || stderr || err.message));
             } else {
                 resolve(stdout);
             }
         });
         child.stdin.write(jobDescription);
         child.stdin.end();
     });
     
     // Check if python script returned a specific error JSON
     try {
         const parsedPythonErr = JSON.parse(geminiResponse);
         if (parsedPythonErr.error) {
             console.error("Python script returned error JSON:", parsedPythonErr);
             return res.status(500).json({ error: "AI assistant encountered an error.", reason: parsedPythonErr.message });
         }
     } catch (e) {
         // Not JSON or not an error JSON, proceed
     }
 } else {
     const resumeText = await extractTextFromPDF(resumePath);
     try {
         geminiResponse = await getATSScore(resumeText);
         console.log("Gemini raw response:\n", geminiResponse); 
     } catch (geminiError) {
         console.error("Gemini API call failed for ATS score:", geminiError);
    
         if (geminiError.message && geminiError.message.includes('429 Too Many Requests') && 
         geminiError.message.includes('quota')) {
         return res.status(429).json({
         error: "AI assistant is currently unavailable due to quota limits.",
         reason: "Gemini API quota exceeded. Please try again later."
         });
         } 
         else if (geminiError.name === 'ResourceExhaustedError' || geminiError.name === 'GoogleGenerativeAIError') {
         return res.status(500).json({
         error: "AI assistant encountered an API error.",
         reason: geminiError.message || "An unspecified Google Generative AI error occurred."
         });
         }
         else {
         return res.status(500).json({
         error: "Failed to get ATS score from AI assistant.",
         reason: geminiError.message || "An unexpected error occurred during AI processing."
         });
         }
     }
 }

 // Try to extract JSON block safely even if Gemini adds markdown
 const match = geminiResponse.match(/```json([\s\S]*?)```/);
 const rawJSON = match ? match[1].trim() : geminiResponse;

 try {
 const parsed = JSON.parse(rawJSON);
 return res.status(200).json({
 score: parsed.score || 0,
 summary: parsed.summary || 'No summary.',
 strengths: parsed.strengths || [],
 suggestions: parsed.suggestions || [],
 raw: geminiResponse // for debugging
 });
 } catch (jsonErr) {
 console.warn("Could not parse JSON response from Gemini for ATS score:", jsonErr);
 return res.status(500).json({ 
 error: "Invalid AI response format.",
 reason: "AI response was not in expected JSON format. Please try again."
 });
 }

 } catch (err) {
 // This outer catch handles errors like PDF parsing failures or file system issues
 console.error("General ATS error:", err);
 return res.status(500).json({
 error: "Resume processing failed",
 reason: err.message
 });
 } finally {
 // Ensure the uploaded file is always deleted if it exists
 if (resumePath && fs.existsSync(resumePath)) {
 fs.unlinkSync(resumePath);
 console.log("Cleaned up uploaded resume file:", resumePath);
 }
 }
});

export default router;