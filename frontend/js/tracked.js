// State
const userId = localStorage.getItem('userId');

// Data Fetching

async function loadTracked() {
	const trackedResults = document.getElementById('trackedResults');
	trackedResults.innerHTML =
		'<p class="tracker-status-message">Loading your tracked internships...</p>';

	try {
		// Ensure userId exists before fetching
		if (!userId) {
			trackedResults.innerHTML =
				'<p class="tracker-status-message error">Could not find user ID. Please log in again.</p>';
			return;
		}

		const res = await fetch(`/api/tracked-internships/${userId}`);
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}
		const data = await res.json();

		if (!data.length) {
			trackedResults.innerHTML =
				'<p class="tracker-status-message">You haven\'t tracked any internships yet.</p>';
			return;
		}

		trackedResults.innerHTML = ''; // Clear loading message
		data.forEach((job) => {
			const div = document.createElement('div');
			div.className = 'card';

			const atsScoreValue = job.ats !== null ? parseInt(job.ats) : -1;
			const atsScoreText =
				atsScoreValue !== -1 ? `${atsScoreValue}%` : 'N/A';
			let atsClass = 'ats-none';

			if (atsScoreValue >= 70) {
				atsClass = 'ats-high';
				div.classList.add('card-ats-high');
			} else if (atsScoreValue >= 40) {
				atsClass = 'ats-medium';
				div.classList.add('card-ats-medium');
			} else if (atsScoreValue !== -1) {
				atsClass = 'ats-low';
				div.classList.add('card-ats-low');
			}

			const trackedDate = new Date(job.trackedAt).toLocaleDateString(
				'en-US',
				{
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				},
			);

			div.innerHTML = `
 <div class="card-content">
 <h4>${job.title}</h4>
 <p><strong>Company:</strong> ${job.company}</p>
 <p><strong>ATS Match:</strong> <span class="${atsClass}">${atsScoreText}</span></p>
 <p><a href="${job.link}" target="_blank" class="card-link">🔗 View Internship</a></p>
 <p class="tracked-date">Tracked on: ${trackedDate}</p>
 </div>
 <div class="card-actions">
 <button onclick="untrackInternship('${job._id}')" class="untrack-btn">Untrack</button>
 </div>
 `;
			trackedResults.appendChild(div);
		});
	} catch (error) {
		console.error('Failed to load tracked internships:', error);
		trackedResults.innerHTML =
			'<p class="tracker-status-message error">Error loading tracked internships. Please try again later.</p>';
	}
}

// Handlers
async function untrackInternship(id) {
	const confirmDelete = confirm(
		'Are you sure you want to remove this from your tracker?',
	);
	if (!confirmDelete) return;

	try {
		const res = await fetch(`/api/untrack-internship/${id}`, {
			method: 'DELETE',
		});

		const data = await res.json();

		if (res.ok) {
			alert('Internship untracked successfully!');
			loadTracked(); // Refresh the list
		} else {
			alert(
				`Failed to untrack internship: ${data.message || 'Unknown error'}`,
			);
		}
	} catch (err) {
		console.error('Error while untracking:', err);
		alert('Network error while untracking internship.');
	}
}

// Initialization
window.onload = loadTracked;
