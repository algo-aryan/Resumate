document.addEventListener('DOMContentLoaded', function () {
	// State
	let allInternships = [];

	// DOM Elements

	const fileInput = document.getElementById('resumeFile');
	const customLabel = document.getElementById('customFileLabel');
	const uploadForm = document.getElementById('uploadForm');
	const loadingSpinner = document.getElementById('loadingSpinner');
	const uploadingMessage = document.getElementById('uploadingMessage');
	const internshipResults = document.getElementById('internshipResults');
	const rightPanel = document.getElementById('rightPanel');
	const uploadErrorDisplay = document.getElementById('uploadErrorDisplay');
	const filterToggleBtn = document.getElementById('filterToggleBtn');
	const filterControlsWrapper = document.getElementById(
		'filterControlsWrapper',
	);
	const filterIcon = document.getElementById('filter-icon');
	const locationFilter = document.getElementById('locationFilter');
	const minStipendInput = document.getElementById('minStipend');
	const minAtsInput = document.getElementById('minAts');
	const applyFiltersBtn = document.getElementById('applyFiltersBtn');
	const resetFiltersBtn = document.getElementById('resetFiltersBtn');

	rightPanel.style.display = 'none';

	// Event Listeners
	if (fileInput) {
		fileInput.addEventListener('change', () => {
			const fileName =
				fileInput.files.length > 0
					? fileInput.files[0].name
					: 'Choose PDF Resume';
			customLabel.textContent = `📎 ${fileName}`;
		});
	}

	uploadForm?.addEventListener('submit', async function (e) {
		e.preventDefault();
		const file = fileInput.files[0];
		if (!file) {
			alert('Please upload a resume file (PDF).');
			return;
		}

		loadingSpinner.style.display = 'block';
		uploadingMessage.style.display = 'block';
		rightPanel.style.display = 'none';
		internshipResults.innerHTML = '';
		filterControlsWrapper.classList.remove('show-filters');
		filterIcon.textContent = '';
		filterToggleBtn.textContent = 'Show Filters';
		filterToggleBtn.prepend(filterIcon);

		uploadErrorDisplay.style.display = 'none';
		uploadErrorDisplay.innerText = '';

		const formData = new FormData();
		formData.append('resume', file);

		try {
			const res = await fetch(`/api/upload`, {
				method: 'POST',
				body: formData,
			});

			if (!res.ok) {
				const rawErrorText = await res.text();
				let errorData = {};
				try {
					errorData = JSON.parse(rawErrorText);
				} catch (parseError) {
					errorData = { message: rawErrorText || res.statusText };
				}

				if (res.status === 429) {
					uploadErrorDisplay.innerText =
						'AI assistant is currently unavailable due to quota limits. Please try again later.';
				} else {
					uploadErrorDisplay.innerText = `Error processing resume: ${errorData.reason || errorData.error || errorData.message || 'Unknown error.'}`;
				}
				uploadErrorDisplay.style.display = 'block';

				loadingSpinner.style.display = 'none';
				uploadingMessage.style.display = 'none';
				rightPanel.style.display = 'block';
				internshipResults.innerHTML = '';

				return;
			}

			const data = await res.json();
			loadingSpinner.style.display = 'none';
			uploadingMessage.style.display = 'none';

			if (data.internships && data.internships.length > 0) {
				allInternships = data.internships;
				renderInternships(allInternships);
				rightPanel.style.display = 'block';
				populateLocationFilter();
			} else {
				internshipResults.innerHTML =
					'<p class="no-results-message">No internships found matching your resume.</p>';
				rightPanel.style.display = 'block';
			}
		} catch (err) {
			console.error('Upload failed:', err);
			loadingSpinner.style.display = 'none';
			uploadingMessage.style.display = 'none';
			rightPanel.style.display = 'block';

			uploadErrorDisplay.innerText =
				'Network error or unexpected issue. Please check your connection or try again.';
			uploadErrorDisplay.style.display = 'block';
			internshipResults.innerHTML = '';
		}
	});

	filterToggleBtn.addEventListener('click', function () {
		filterControlsWrapper.classList.toggle('show-filters');
		if (filterControlsWrapper.classList.contains('show-filters')) {
			filterIcon.textContent = '🔼';
			filterToggleBtn.textContent = 'Hide Filters';
			filterToggleBtn.prepend(filterIcon);
		} else {
			filterIcon.textContent = '';
			filterToggleBtn.textContent = 'Show Filters';
			filterToggleBtn.prepend(filterIcon);
		}
	});

	// Helper Functions
	function renderInternships(internshipsToRender) {
		internshipResults.innerHTML = '<h3>Internship Matches</h3>';

		if (!internshipsToRender || internshipsToRender.length === 0) {
			internshipResults.innerHTML +=
				'<p class="no-results-message">No results found for the selected filters.</p>';
			return;
		}

		internshipsToRender.forEach((job) => {
			const matchDiv = document.createElement('div');
			matchDiv.className = 'card';

			const atsScore = job.ats !== 'N/A' ? parseInt(job.ats) : 0;
			let atsSpanClass = 'ats-none';

			if (atsScore >= 80) {
				atsSpanClass = 'ats-high';
				matchDiv.classList.add('card-ats-high');
			} else if (atsScore >= 45) {
				atsSpanClass = 'ats-medium';
				matchDiv.classList.add('card-ats-medium');
			} else {
				atsSpanClass = 'ats-low';
				matchDiv.classList.add('card-ats-low');
			}

			matchDiv.innerHTML = `
 <h4>${job.title}</h4>
 <p><strong>Company:</strong> ${job.company || 'N/A'}</p>
 <p><strong>📍 Location:</strong> ${job.location}</p>
 <p><strong>💰 Stipend:</strong> ${job.stipend}</p>
 <p><strong>ATS Match:</strong> <span class="${atsSpanClass}">${job.ats}%</span></p>
 <div class="card-links">
 <a href="${job.link}" target="_blank" class="card-link">View Internship</a>
 <a href="${job.apply}" target="_blank" class="card-link apply">Apply Now</a>
 </div>
 <button class="track-btn" data-title="${job.title}" data-company="${job.company}" data-link="${job.link}" data-ats="${job.ats}">📌 Track this</button>
 `;

			internshipResults.appendChild(matchDiv);

			const trackBtn = matchDiv.querySelector('.track-btn');
			trackBtn.addEventListener('click', async function () {
				const internshipData = {
					title: this.dataset.title,
					company: this.dataset.company,
					link: this.dataset.link,
					ats: this.dataset.ats,
					userId: localStorage.getItem('userId') || '',
				};

				try {
					const response = await fetch('/api/track-internship', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(internshipData),
					});

					if (response.ok) {
						alert('Internship tracked successfully!');
					} else {
						const errData = await response.json();
						alert(`Failed to track internship: ${errData.message}`);
					}
				} catch (err) {
					console.error('Tracking Error:', err);
					alert('Could not track the internship. Try again.');
				}
			});
		});
	}

	function populateLocationFilter() {
		locationFilter.innerHTML = '<option value="">All Locations</option>';
		const uniqueLocations = [
			...new Set(
				allInternships.map((job) => job.location).filter(Boolean),
			),
		].sort();
		uniqueLocations.forEach((location) => {
			const option = document.createElement('option');
			option.value = location;
			option.textContent = location;
			locationFilter.appendChild(option);
		});
	}

	applyFiltersBtn.addEventListener('click', applyFilters);
	resetFiltersBtn.addEventListener('click', resetFilters);

	function applyFilters() {
		const locationValue = locationFilter.value.toLowerCase();
		const minStipend = parseInt(minStipendInput.value) || 0;
		const minATS = parseInt(minAtsInput.value) || 0;

		const filteredInternships = allInternships.filter((job) => {
			const jobLocation = job.location ? job.location.toLowerCase() : '';
			const jobStipendMatch = job.stipend
				? job.stipend.match(/[\d,]+/)
				: null;
			const jobStipend = jobStipendMatch
				? parseInt(jobStipendMatch[0].replace(/,/g, ''))
				: 0;
			const jobATS = job.ats !== 'N/A' ? parseInt(job.ats) : 0;

			const matchLocation =
				!locationValue || jobLocation.includes(locationValue);
			const matchStipend = jobStipend >= minStipend;
			const matchATS = jobATS >= minATS;

			return matchLocation && matchStipend && matchATS;
		});

		renderInternships(filteredInternships);
	}

	function resetFilters() {
		locationFilter.value = '';
		minStipendInput.value = '';
		minAtsInput.value = '';
		renderInternships(allInternships);
	}
});
