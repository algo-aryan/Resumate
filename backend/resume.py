import os
import sys
import json
from dotenv import load_dotenv
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, GoogleAPIError

# Assuming you have a separate file for GitHub logic, e.g., github_service.py
# If not, you would place the fetch_github_projects function here.
# For this example, let's simulate the function and its potential errors.
import requests # Make sure to install with: pip install requests

def fetch_github_projects(username):
 """
 Fetches public repository data for a given GitHub username.
 Returns a list of projects or an error dictionary.
 """
 api_url = f"https://api.github.com/users/{username}/repos"
 headers = {"Accept": "application/vnd.github.v3+json"}
 
 try:
 response = requests.get(api_url, headers=headers)
 
 # --- THIS IS THE CRITICAL FIX ---
 # If user is not found, GitHub API returns a 404 status code
 if response.status_code == 404:
 return {"error": f"GitHub user '{username}' not found."}
 
 # Raise an exception for other HTTP errors (e.g., rate limiting)
 response.raise_for_status()
 
 repos = response.json()
 projects = []
 for repo in repos:
 # Ensure the repo is not a fork and has a description
 if not repo.get('fork') and repo.get('description'):
 projects.append({
 "title": repo.get('name', 'No Title'),
 "description": repo.get('description', 'No Description')
 })
 return {"projects": projects}
 
 except requests.exceptions.RequestException as e:
 # Handle network-related errors
 return {"error": f"Failed to connect to GitHub API: {e}"}

# This function is assumed to be in your main Flask/FastAPI app file (e.g., app.py)
# I am including it here to show the complete logic.
# @app.route('/api/import/github/<username>', methods=['GET'])
# def get_github_projects(username):
# result = fetch_github_projects(username)
# if "error" in result:
# return jsonify(result), 404 # Return 404 for not found, 500 for other errors
# return jsonify(result)


# The rest of your script for interacting with Gemini remains the same.
# This part is for generating the resume summary, not fetching from GitHub.
def query_llm_with_all_info(name, goal, skills, education, experience, projects):
 prompt = f"""You are a resume writing assistant.
Write a professional, first-person resume summary in 3 crisp lines. Use "I" instead of third-person names.
Keep the tone confident but authentic — suitable for job applications.

Here are the details:
Name: {name}
Career Goal: {goal}
Skills: {', '.join(skills)}
Education: {', '.join([f"{e['degree']} from {e['institution']} in {e['year']}" for e in education])}
Experience: {', '.join([f"{e['role']} at {e['company']} ({e['year']}) - {e['description']}" for e in experience])}
Projects: {', '.join([f"{p['title']} - {p['description']}" for p in projects])}

Start directly with the summary. Do not repeat the inputs.
"""
 try:
 model = genai.GenerativeModel("models/gemini-1.5-flash-latest")
 response = model.generate_content(prompt)
 print("Gemini API Response:", response.text, file=sys.stderr)
 return [line.strip() for line in response.text.split('\n') if line.strip()][:3]
 except ResourceExhausted as e:
 error_payload = {"error": "Gemini_Quota_Exhausted", "message": f"Gemini API quota exceeded: {e}"}
 print(json.dumps(error_payload))
 sys.exit(1)
 except GoogleAPIError as e:
 error_payload = {"error": "Gemini_API_Error", "message": f"Gemini API error: {e}"}
 print(json.dumps(error_payload))
 sys.exit(1)
 except Exception as e:
 error_payload = {"error": "Summary_Generation_Failed", "message": f"An unexpected error occurred: {e}"}
 print(json.dumps(error_payload))
 sys.exit(1)

if __name__ == "__main__":
 # This main block is for generating the resume summary based on stdin.
 # The GitHub fetching logic would typically be part of your web server backend, not this script.
 try:
 raw = sys.stdin.read()
 resume_data = json.loads(raw)
 summary = query_llm_with_all_info(
 resume_data.get("name", ""),
 resume_data.get("goal", ""),
 resume_data.get("skills", []),
 resume_data.get("education", []),
 resume_data.get("experience", []),
 resume_data.get("projects", [])
 )
 print(json.dumps(summary))
 except json.JSONDecodeError as e:
 error_payload = {"error": "Invalid_Input", "message": f"Failed to parse input JSON: {e}"}
 print(json.dumps(error_payload))
 sys.exit(1)
 except Exception as e:
 error_payload = {"error": "Python_Script_Error", "message": f"An unhandled error in script: {e}"}
 print(json.dumps(error_payload))
 sys.exit(1)