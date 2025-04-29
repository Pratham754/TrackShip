document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/my-jobs');
    const jobs = await response.json();

    const jobList = document.getElementById('jobList');
    jobList.innerHTML = '';

    jobs.forEach(job => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';

        li.innerHTML = `
            <div>
                <p><strong>Description:</strong> ${job.jobDescription}</p>
                <p><strong>Contact Name:</strong> ${job.contactName}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Contact Info:</strong> ${job.contactInfo}</p>
                <p><strong>Status:</strong> ${job.status}</p>
            </div>
            <div>
                <form action="/update-job-status" method="post" class="d-inline">
                    <input type="hidden" name="id" value="${job.id}">
                    <button type="submit" name="status" value="complete" class="btn btn-success btn-sm">Done</button>
                </form>
                <form action="/update-job-status" method="post" class="d-inline">
                    <input type="hidden" name="id" value="${job.id}">
                    <button type="submit" name="status" value="pending" class="btn btn-danger btn-sm">Not Done</button>
                </form>
            </div>
        `;

        jobList.appendChild(li);
    });
});
