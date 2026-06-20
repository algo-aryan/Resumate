document.addEventListener('DOMContentLoaded', () => {
 const form = document.getElementById('resume-form');
 const fileInput = document.getElementById('resume');
 const submitButton = document.querySelector('.btn.btn-primary'); 
 const resultContainer = document.getElementById('result-container');
 const scoreEl = document.getElementById('score');
 const summaryEl = document.getElementById('summary');
 const strengthsEl = document.getElementById('strengths');
 const suggestionsEl = document.getElementById('suggestions');
 
 const atsErrorDisplay = document.getElementById('atsErrorDisplay');

 form.addEventListener('submit', async (e) => {
 e.preventDefault();

 const file = fileInput.files[0];
 if (!file) {
 alert('Please select a resume file.'); 
 return;
 }

 // Show loading state
 submitButton.classList.add('loading');
 resultContainer.classList.add('d-none'); 
 
 // Clear and hide previous ATS errors
 atsErrorDisplay.classList.add('hidden');
 atsErrorDisplay.innerText = '';

 const formData = new FormData();
 formData.append('resume', file);
 const jdText = document.getElementById('jobDescription').value;
 if (jdText) {
     formData.append('jobDescription', jdText);
 }

 try {
 const res = await fetch('https://resumate-ewtu.onrender.com/api/ats-score', {
 method: 'POST',
 body: formData
 });

 if (!res.ok) { 
 const rawErrorText = await res.text();
 console.error('Raw Backend Error Response Text:', rawErrorText);

 let errorData = {};
 try {
 errorData = JSON.parse(rawErrorText);
 } catch (parseError) {
 console.error('Failed to parse backend error response as JSON:', parseError);
 errorData = { reason: rawErrorText }; 
 }
 
 let userFacingMessage = 'Something went wrong while scoring the resume. Please try again.'; 

 if (res.status === 429) {
 userFacingMessage = 'AI assistant is currently unavailable due to quota limits. Please try again later.';
 } else {
 console.error('Backend Error for ATS score (parsed):', res.status, errorData);
 userFacingMessage = `An error occurred during ATS scoring: ${errorData.reason || 'Unknown error'}.`;
 }
 
 atsErrorDisplay.innerText = userFacingMessage;
 atsErrorDisplay.classList.remove('hidden');
 
 scoreEl.textContent = 'N/A';
 summaryEl.textContent = 'No data.';
 strengthsEl.innerHTML = '';
 suggestionsEl.innerHTML = '';
 
 return; 
 }

 const data = await res.json();

 let scoreValue = 'N/A';
 if (typeof data.score === 'number') { 
 scoreValue = data.score + '%';
 } else if (typeof data.score === 'string') { 
 scoreValue = data.score.replace(/%/g, '') + '%'; 
 }
 scoreEl.textContent = scoreValue;
 summaryEl.textContent = data.summary ?? 'No summary.';

 let parsed = { strengths: [], suggestions: [] };

 try {
 if (data.raw && data.raw.includes('```json')) {
 const match = data.raw.match(/```json\s*([\s\S]*?)\s*```/);
 if (match && match[1]) parsed = JSON.parse(match[1]);
 } else if (data.raw) {
 parsed = JSON.parse(data.raw);
 }
 } catch (err) {
 console.warn('Gemini JSON parsing failed (for ATS suggestions):', err);
 strengthsEl.innerHTML = '<li class="list-group-item text-red-500">Could not parse strengths from AI response.</li>';
 suggestionsEl.innerHTML = '<li class="list-group-item text-red-500">Could not parse suggestions from AI response.</li>';
 resultContainer.classList.remove('d-none'); 
 return; 
 }

 strengthsEl.innerHTML = '';
 (parsed.strengths || []).forEach(item => {
 const li = document.createElement('li');
 li.className = 'list-group-item';
 li.textContent = item;
 strengthsEl.appendChild(li);
 });

 suggestionsEl.innerHTML = '';
 (parsed.suggestions || []).forEach(item => {
 const li = document.createElement('li');
 li.className = 'list-group-item';
 li.textContent = item;
 suggestionsEl.appendChild(li);
 });

 resultContainer.classList.remove('d-none'); 
 } catch (err) {
 console.error('Frontend Error (Network/Unexpected for ATS):', err);
 atsErrorDisplay.innerText = 'Network error. Please check your internet connection and try again.';
 atsErrorDisplay.classList.remove('hidden');
 
 scoreEl.textContent = 'N/A';
 summaryEl.textContent = 'No data.';
 strengthsEl.innerHTML = '';
 suggestionsEl.innerHTML = '';
 } finally {
 submitButton.classList.remove('loading');
 }
 });

 const resumeInput = document.getElementById('resume');
 const fileNameDisplay = document.getElementById('file-name-display');

 resumeInput.addEventListener('change', function () {
 if (this.files && this.files.length > 0) {
 fileNameDisplay.textContent = this.files[0].name;
 fileNameDisplay.classList.add('has-file');
 } else {
 fileNameDisplay.textContent = 'No file chosen';
 fileNameDisplay.classList.remove('has-file');
 }
 });
 });