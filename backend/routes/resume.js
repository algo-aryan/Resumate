// Imports
import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';


// Setup
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ dest: 'uploads/' });

// Routes

// Python resume extractor route
router.post('/upload', upload.single('resume'), (req, res) => {
	const uploadedPath = path.resolve(__dirname, '../', req.file.path);
	const pythonPath = 'python3'; // or 'python'
	const scriptPath = path.resolve(__dirname, '../skill_extractor.py');

	exec(
		`"${pythonPath}" "${scriptPath}" "${uploadedPath}"`,
		{
			env: { ...process.env },
		},
		(err, stdout, stderr) => {
			// IMPORTANT: Ensure the uploaded file is cleaned up regardless of outcome
			fs.unlink(uploadedPath, (unlinkErr) => {
				if (unlinkErr)
					console.error('Error deleting uploaded file:', unlinkErr);
			});

			// Log both stdout and stderr for full debugging context
			console.log('Python script raw stdout:\n', stdout);
			if (stderr) console.error('Python script raw stderr:\n', stderr);

			if (err) {
				// Python script exited with a non-zero code
				console.error('Python Execution Error (exit code !== 0):', err);

				try {
					const errorOutput = JSON.parse(stdout); // Attempt to parse stdout as JSON error
					if (errorOutput.error === 'Gemini_Quota_Exhausted') {
						// If skill_extractor.py explicitly signals quota exhaustion
						return res.status(429).json({
							error: 'AI assistant is currently unavailable due to quota limits.',
							reason: errorOutput.message,
						});
					} else {
						// Other types of structured errors from the Python script
						return res.status(500).json({
							error: `Python script error: ${errorOutput.error || 'Unknown'}`,
							reason: errorOutput.message || stdout,
						});
					}
				} catch (jsonParseError) {
					// If stdout is not valid JSON when an error occurred, it's a generic script failure
					console.error(
						'Failed to parse Python script stdout as JSON (during error):',
						jsonParseError,
					);
					return res.status(500).json({
						error: 'Python script execution failed.',
						reason: stderr || err.message || stdout, // Provide stderr, exec error message, or raw stdout
					});
				}
			}

			// If execution was successful (err is null or code is 0)
			try {
				// Attempt to parse stdout as JSON for successful execution
				const pythonOutput = JSON.parse(stdout);

				if (pythonOutput && Array.isArray(pythonOutput.internships)) {
					// Successfully parsed and found the 'internships' array
					return res
						.status(200)
						.json({ internships: pythonOutput.internships });
				} else {
					// stdout was valid JSON, but didn't contain the expected 'internships' array
					console.error(
						"Python script output did not contain 'internships' array:",
						pythonOutput,
					);
					return res
						.status(500)
						.json({
							error: 'Invalid output format from Python script.',
						});
				}
			} catch (jsonParseError) {
				// stdout was not valid JSON for a successful response (unexpected)
				console.error(
					'Failed to parse Python script stdout as JSON (during success):',
					jsonParseError,
				);
				console.error('Raw stdout causing parse error:', stdout);
				return res
					.status(500)
					.json({
						error: 'Invalid or malformed JSON output from Python script.',
					});
			}
		},
	);
});

// Exports
export default router;
