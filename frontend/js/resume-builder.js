document.addEventListener('DOMContentLoaded', () => {
        // --- CORE FUNCTION TO UPDATE THE ENTIRE PREVIEW ---
        function updatePreview() {
            // 1. Update Personal Details
            document.getElementById('preview-name').textContent = document.getElementById('name').value || 'Your Name';
            const contactDetails = ['location', 'phone', 'email', 'linkedin', 'github']
                .map(id => document.getElementById(id).value.trim())
                .filter(Boolean)
                .join(' &bull; ');
            document.getElementById('preview-contact').innerHTML = contactDetails;

            // 2. Update Summary
            const summaryText = document.getElementById('summary').value;
            const summaryContent = document.getElementById('preview-summary-content');
            if (summaryText) {
                summaryContent.textContent = summaryText;
                summaryContent.style.fontStyle = 'normal';
            } else {
                summaryContent.textContent = 'Your professional summary will appear here.';
                summaryContent.style.fontStyle = 'italic';
            }

            // 3. Update Skills
            const skillsText = document.getElementById('skills').value;
            const skillsContainer = document.getElementById('preview-skills');
            skillsContainer.innerHTML = '<h3 class="preview-section-title">Skills</h3>';
            if (skillsText) {
                const skillsList = document.createElement('ul');
                skillsText.split(',').forEach(skill => {
                    const trimmedSkill = skill.trim();
                    if (trimmedSkill) {
                        const li = document.createElement('li');
                        li.textContent = trimmedSkill;
                        skillsList.appendChild(li);
                    }
                });
                skillsContainer.appendChild(skillsList);
            }

            // 4. Update Dynamic Sections
            updateDynamicSection('education');
            updateDynamicSection('experience');
            updateDynamicSection('project', 'projects');
        }

        // --- RENDERER FOR DYNAMIC SECTIONS (EDUCATION, EXPERIENCE, ETC.) ---
        function updateDynamicSection(sectionId, previewId = sectionId) {
            const entriesContainer = document.getElementById(`${sectionId}-entries`);
            const previewContainer = document.getElementById(`preview-${previewId}`);
            
            const titleCaseId = previewId.charAt(0).toUpperCase() + previewId.slice(1).replace('-', ' ');
            previewContainer.innerHTML = `<h3 class="preview-section-title">${titleCaseId}</h3>`;

            entriesContainer.querySelectorAll('.dynamic-entry').forEach(entry => {
                const fields = {};
                entry.querySelectorAll('[data-field]').forEach(input => {
                    fields[input.dataset.field] = input.value;
                });
                
                const entryHtml = createEntryHtml(sectionId, fields);
                if (entryHtml) previewContainer.insertAdjacentHTML('beforeend', entryHtml);
            });
        }
        
        // --- HTML TEMPLATE GENERATOR FOR PREVIEW ENTRIES ---
        function createEntryHtml(sectionId, f) {
            if (sectionId === 'education' && (f.school || f.degree)) {
                return `<div class="preview-entry">
                            <p class="title">${f.degree || 'Degree'}</p>
                            <div class="subtitle">
                                <span>${f.school || 'School/University'}</span>
                                <span>${f.dates || 'Dates'}</span>
                            </div>
                            ${f.gpa ? `<p><strong>GPA:</strong> ${f.gpa}</p>` : ''}
                        </div>`;
            }
            if (sectionId === 'experience' && (f.role || f.company)) {
                return `<div class="preview-entry">
                            <p class="title">${f.role || 'Job Title'}</p>
                            <div class="subtitle">
                                <span>${f.company || 'Company'}</span>
                                <span>${f.dates || 'Dates'}</span>
                            </div>
                            ${f.description ? `<ul class="description">${f.description.split('\\n').filter(line => line.trim()).map(line => `<li>${line.trim()}</li>`).join('')}</ul>` : ''}
                        </div>`;
            }
            if (sectionId === 'project' && f.title) {
                return `<div class="preview-entry">
                            <p class="title">${f.title}</p>
                            <div class="subtitle">
                                <span>${f.link ? `<a href="${f.link}" target="_blank">${f.link}</a>` : ''}</span>
                                <span></span>
                            </div>
                            ${f.description ? `<ul class="description">${f.description.split('\\n').filter(line => line.trim()).map(line => `<li>${line.trim()}</li>`).join('')}</ul>` : ''}
                        </div>`;
            }
            return '';
        }

        // --- FORM BLOCK GENERATOR FOR DYNAMIC ENTRIES ---
        function addDynamicEntry(sectionId) {
            const container = document.getElementById(`${sectionId}-entries`);
            const entryDiv = document.createElement('div');
            entryDiv.className = 'dynamic-entry';
            let formHtml = '';

            if (sectionId === 'education') {
                formHtml = `<div class="input-group"><label>School/University</label><input type="text" data-field="school"></div>
                            <div class="input-row">
                                <div class="input-group"><label>Degree</label><input type="text" data-field="degree"></div>
                                <div class="input-group"><label>Dates</label><input type="text" data-field="dates"></div>
                            </div>
                            <div class="input-group"><label>GPA</label><input type="text" data-field="gpa"></div>`;
            } else if (sectionId === 'experience') {
                formHtml = `<div class="input-group"><label>Job Title / Role</label><input type="text" data-field="role"></div>
                            <div class="input-row">
                                <div class="input-group"><label>Company</label><input type="text" data-field="company"></div>
                                <div class="input-group"><label>Dates</label><input type="text" data-field="dates"></div>
                            </div>
                            <div class="input-group"><label>Description (use '\\n' for new lines)</label><textarea rows="4" data-field="description"></textarea></div>`;
            } else if (sectionId === 'project') {
                formHtml = `<div class="input-group"><label>Project Title</label><input type="text" data-field="title"></div>
                            <div class="input-group"><label>Project Link</label><input type="url" data-field="link"></div>
                            <div class="input-group"><label>Description (use '\\n' for new lines)</label><textarea rows="3" data-field="description"></textarea></div>`;
            }
            entryDiv.innerHTML = formHtml;
            container.appendChild(entryDiv);
            entryDiv.querySelector('input, textarea')?.focus();
        }

        // --- EVENT LISTENERS ---
        document.querySelector('.form-section').addEventListener('input', updatePreview);

        document.getElementById('add-education-btn').addEventListener('click', () => addDynamicEntry('education'));
        document.getElementById('add-experience-btn').addEventListener('click', () => addDynamicEntry('experience'));
        document.getElementById('add-project-btn').addEventListener('click', () => addDynamicEntry('project'));

        // --- PDF Download Logic ---
        document.getElementById('download-pdf-btn').addEventListener('click', () => {
            const downloadBtn = document.getElementById('download-pdf-btn');
            const resumePreview = document.getElementById('resume-preview');
            const { jsPDF } = window.jspdf;

            downloadBtn.textContent = 'Downloading...';
            downloadBtn.disabled = true;

            html2canvas(resumePreview, { scale: 2 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const margin = 10;

                const pdfPageWidth = pdf.internal.pageSize.getWidth();
                const pdfPageHeight = pdf.internal.pageSize.getHeight();
                
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasHeight / canvasWidth;

                let imgWidth = pdfPageWidth - (margin * 2);
                let imgHeight = imgWidth * ratio;

                if (imgHeight > (pdfPageHeight - (margin * 2))) {
                    imgHeight = pdfPageHeight - (margin * 2);
                    imgWidth = imgHeight / ratio;
                }

                const xPosition = (pdfPageWidth - imgWidth) / 2;
                const yPosition = margin;

                pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
                pdf.save("resume.pdf");

                downloadBtn.textContent = 'Download PDF';
                downloadBtn.disabled = false;
            });
        });


        // --- INITIAL SETUP ---
        updatePreview();
    });