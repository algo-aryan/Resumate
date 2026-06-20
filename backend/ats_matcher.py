# ats_matcher.py
import sys
import json
import os
import PyPDF2
import google.generativeai as genai

def extract_text_from_pdf(pdf_path):
    try:
        text = ""
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        print(json.dumps({"error": "PDF_Extraction_Failed", "message": str(e)}))
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing Arguments", "message": "Resume PDF path is required."}))
        sys.exit(1)

    resume_path = sys.argv[1]
    
    # Read job description from stdin
    jd_text = sys.stdin.read().strip()
    
    if not jd_text:
        print(json.dumps({"error": "Missing Arguments", "message": "Job Description is required via stdin."}))
        sys.exit(1)

    resume_text = extract_text_from_pdf(resume_path)

    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-1.5-flash')

    prompt = f"""
    You are an ATS bot. Evaluate the following resume against the provided Job Description.
    
    Resume:
    {resume_text}
    
    Job Description:
    {jd_text}
    
    Provide your evaluation strictly as a JSON object with the following keys:
    - "score": A numeric ATS score from 0 to 100 representing the match percentage.
    - "summary": A brief profile summary or general overview of the candidate's fit.
    - "strengths": An array of strings highlighting the matching keywords and strengths.
    - "suggestions": An array of strings with personalized suggestions for skills, missing keywords, and achievements to enhance the resume for this specific job.
    
    Return ONLY valid JSON.
    """

    try:
        response = model.generate_content(prompt)
        text = response.text
        # Clean markdown codeblocks if any
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        print(text)
    except Exception as e:
        print(json.dumps({"error": "Gemini_API_Failed", "message": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()