document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('resume-form');
            const fileInput = document.getElementById('resume');
            const fileNameDisplay = document.getElementById('file-name-display');
            const submitButton = document.querySelector('.btn.btn-primary');
            const resultContainer = document.getElementById('result-container');
            const errorContainer = document.getElementById('error-container');
            const scoreEl = document.getElementById('score');
            const summaryEl = document.getElementById('summary');
            const strengthsEl = document.getElementById('strengths');
            const suggestionsEl = document.getElementById('suggestions');

            // File input handling
            const fileDisplay = document.getElementById('file-name-display');
            if (fileDisplay) {
                fileDisplay.addEventListener('click', () => {
                    fileInput.click();
                });
            }

            fileInput.addEventListener('change', function() {
                const placeholder = fileNameDisplay.querySelector('.file-placeholder');
                if (this.files && this.files.length > 0) {
                    placeholder.textContent = this.files[0].name;
                    fileNameDisplay.classList.add('has-file');
                } else {
                    placeholder.textContent = 'No file chosen';
                    fileNameDisplay.classList.remove('has-file');
                }
            });

            // Form submission
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const file = fileInput.files[0];
                if (!file) {
                    showError('Please select a resume file.');
                    return;
                }

                // Show loading state
                submitButton.classList.add('loading');
                resultContainer.classList.add('hidden');
                errorContainer.classList.add('hidden');

                const formData = new FormData();
                formData.append('resume', file);

                try {
                    const response = await fetch('/api/ats-score', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.reason || 'Something went wrong');
                    }

                    // Display results
                    displayResults(data);

                } catch (error) {
                    console.error('Error:', error);
                    showError(error.message || 'Network error. Please try again.');
                } finally {
                    submitButton.classList.remove('loading');
                }
            });

            function displayResults(data) {
                const score = data.score || 0;
                scoreEl.textContent = score;
                summaryEl.textContent = data.summary || 'No summary available.';

                // Update score level
                const scoreLevel = document.getElementById('score-level');
                if (score >= 80) {
                    scoreLevel.textContent = 'Excellent';
                    scoreLevel.className = 'score-level excellent';
                } else if (score >= 60) {
                    scoreLevel.textContent = 'Good';
                    scoreLevel.className = 'score-level good';
                } else {
                    scoreLevel.textContent = 'Needs Improvement';
                    scoreLevel.className = 'score-level poor';
                }

                // Display strengths
                strengthsEl.innerHTML = '';
                if (data.strengths && data.strengths.length > 0) {
                    data.strengths.forEach(strength => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <div class="list-item-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                                </svg>
                            </div>
                            <span>${strength}</span>
                        `;
                        strengthsEl.appendChild(li);
                    });
                } else {
                    strengthsEl.innerHTML = '<li class="empty-state">No specific strengths identified.</li>';
                }

                // Display suggestions
                suggestionsEl.innerHTML = '';
                if (data.suggestions && data.suggestions.length > 0) {
                    data.suggestions.forEach(suggestion => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <div class="list-item-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                                </svg>
                            </div>
                            <span>${suggestion}</span>
                        `;
                        suggestionsEl.appendChild(li);
                    });
                } else {
                    suggestionsEl.innerHTML = '<li class="empty-state">No specific suggestions at this time.</li>';
                }

                resultContainer.classList.remove('hidden');
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            }

            function showError(message) {
                document.getElementById('error-text').textContent = message;
                errorContainer.classList.remove('hidden');
                errorContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });