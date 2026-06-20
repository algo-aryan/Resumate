import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: 'uploads/' });

// Extract text from PDF using Gemini exactly like main-2.py
async function extractTextFromPDFGemini(pdfPath) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    
    const pdfData = fs.readFileSync(pdfPath).toString('base64');
    const prompt = `Extract all text content from this PDF document.
Return only the plain text without any formatting, markdown, or additional commentary.
Focus on preserving the original structure and content of the resume.`;
    
    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: pdfData,
                mimeType: "application/pdf"
            }
        }
    ]);
    return result.response.text().trim();
}

// Get ATS Score using Gemini exactly like main-2.py
async function getATSScore(resumeText) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are an ATS (Applicant Tracking System) analyzer. Analyze the following resume and provide a comprehensive assessment.
Resume Text:
${resumeText.slice(0, 8000)}
Provide your analysis in the following JSON format:
{
"score": 0,
"summary": "",
"strengths": ["", "", ""],
"suggestions": ["", "", ""]
}
Scoring criteria:
- Clear formatting and structure (25 points)
- Relevant keywords and skills (25 points)
- Professional experience and achievements (25 points)
- Education and qualifications (15 points)
- Contact information and completeness (10 points)
Keep strengths and suggestions concise and actionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

// Main ATS score route
router.post('/ats-score', upload.single('resume'), async (req, res) => {
    console.log("Using API Key length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 'undefined');
    const resumePath = req.file ? path.resolve(__dirname, '../', req.file.path) : null; 

    try {
        if (!resumePath) {
            return res.status(400).json({ error: "No resume file uploaded.", reason: "Please upload a PDF file." });
        }

        console.log("Received ATS score request");
        console.log("Uploaded file path:", resumePath);

        const resumeText = await extractTextFromPDFGemini(resumePath);
        if (!resumeText) {
            return res.status(500).json({ error: "Text extraction failed", reason: "Could not extract text from the PDF." });
        }

        let geminiResponse;
        try {
            geminiResponse = await getATSScore(resumeText);
            console.log("Gemini raw response:\n", geminiResponse); 
        } catch (geminiError) {
            console.error("Gemini API call failed for ATS score:", geminiError);
            return res.status(500).json({
                error: "Failed to get ATS score from AI assistant.",
                reason: geminiError.message || "An unexpected error occurred during AI processing."
            });
        }

        let cleanResponse = geminiResponse;
        if (cleanResponse.includes('```json')) {
            cleanResponse = cleanResponse.split('```json')[1].split('```')[0].trim();
        } else if (cleanResponse.includes('```')) {
            cleanResponse = cleanResponse.split('```')[1].split('```')[0].trim();
        }

        try {
            const parsedData = JSON.parse(cleanResponse);
            return res.status(200).json({
                score: parsedData.score || 0,
                summary: parsedData.summary || 'Analysis completed.',
                strengths: parsedData.strengths || [],
                suggestions: parsedData.suggestions || [],
                raw: geminiResponse
            });
        } catch (jsonErr) {
            console.warn("Could not parse JSON response from Gemini for ATS score:", jsonErr);
            return res.status(500).json({ 
                error: "Invalid AI response format.",
                reason: "AI response was not in expected JSON format. Please try again.",
                score: 0,
                summary: 'Analysis format error.',
                strengths: [],
                suggestions: [],
                raw: geminiResponse
            });
        }

    } catch (err) {
        console.error("General ATS error:", err);
        return res.status(500).json({
            error: "Resume processing failed",
            reason: err.message
        });
    } finally {
        if (resumePath && fs.existsSync(resumePath)) {
            fs.unlinkSync(resumePath);
            console.log("Cleaned up uploaded resume file:", resumePath);
        }
    }
});

export default router;