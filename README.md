# ResuMate

ResuMate is a simple web platform that helps students format their resumes, track their applications, and find relevant internships. It uses Google's Gemini models to extract information from PDFs.

## Features


- **Resume Builder**: A simple tool to compile your experiences and skills into a clean, well-formatted resume.
- **Internship Matcher**: Automatically extracts your top skills from your resume and scrapes Internshala to find the most relevant current internships.
- **Application Tracker**: A lightweight dashboard to keep track of the jobs and internships you've applied to in one place.

## Project Structure

```text
ResuMate/
├── backend/
│   ├── config/              # MongoDB connection
│   ├── models/              # Mongoose schemas (User, TrackedInternship)
│   ├── routes/              # Express API routes (auth.js, resume.js, etc.)
│   ├── uploads/             # Temporary storage for PDF parsing
│   ├── server.js            # Main Node.js server entry point
│   ├── resume.py            # Python script for AI resume building
│   └── skill_extractor.py   # Python script for NLP and web scraping
├── frontend/
│   ├── css/                 # Stylesheets
│   ├── js/                  # Client-side JavaScript

│   ├── dashboard.html       # Main user dashboard
│   ├── index.html           # Landing page
│   ├── login.html           # Login page
│   ├── resume-builder.html  # Resume creator
│   ├── signup.html          # Registration page
│   ├── tracked.html         # Internship tracker page
│   └── upload.html          # File upload and intern matching
├── Dockerfile               # Deployment configuration
└── package.json             # Root-level scripts
```

## Setup Instructions

### Backend Requirements
- Node.js (v18+)
- Python 3.9+
- MongoDB

1. Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
pip install -r requirements.txt
```

2. Create a `.env` file in the `backend/` folder:
```text
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
PORT=3000
```

3. Start the server:
```bash
node server.js
```

### Frontend
Since the Node.js backend serves the frontend statically, you do not need a separate development server. Just start the backend and visit `http://localhost:3000` in your browser.

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Node.js (Express), Python (BeautifulSoup, PyMuPDF, Spacy)
- **Database**: MongoDB
- **AI Models**: Google Gemini API

## License
MIT License
