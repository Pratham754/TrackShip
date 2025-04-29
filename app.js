const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

const connectDB = require('./db');
const User = require('./models/User');
const LoginLog = require('./models/LoginLog');
const Job = require('./models/Job');

connectDB();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

let deliveryJobs = [];

function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/');
}

function hasRole(role) {
    return (req, res, next) => {
        if (req.session.user?.role === role) return next();
        res.status(403).send('Forbidden');
    };
}

// --- Routes ---

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Login POST
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && user.password === password) {
        req.session.user = { username: user.username, role: user.role };
        await new LoginLog({ username, action: 'login' }).save();

        const redirectPath = user.role === 'manager' ? '/manager' : '/delivery-guy';
        return res.redirect(redirectPath);
    }

    res.redirect('/?error=1');
});

// Logout
app.post('/logout', async (req, res) => {
    if (req.session.user) {
        await new LoginLog({ username: req.session.user.username, action: 'logout' }).save();
    }
    req.session.destroy(err => {
        if (err) return res.status(500).send('Logout failed');
        res.redirect('/');
    });
});

// ---- MANAGER ----

app.get('/manager', isAuthenticated, hasRole('manager'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'manager', 'dashboard.html'));
});

app.get('/manager/assign-job', isAuthenticated, hasRole('manager'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'manager', 'assign-job.html'));
});

app.get('/manager/jobs-assigned', isAuthenticated, hasRole('manager'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'manager', 'jobs_assigned.html'));
});

app.get('/manager/jobs-done', isAuthenticated, hasRole('manager'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'manager', 'jobs_done.html'));
});

app.get('/manager/jobs-pending', isAuthenticated, hasRole('manager'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'manager', 'jobs_pending.html'));
});

// ---- DELIVERY GUY ----

app.get('/delivery-guy', isAuthenticated, hasRole('deliveryguy'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'delivery_guy', 'dashboard.html'));
});

app.get('/delivery-guy/jobs-done', isAuthenticated, hasRole('deliveryguy'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'delivery_guy', 'jobs_done.html'));
});

app.get('/delivery-guy/jobs-pending', isAuthenticated, hasRole('deliveryguy'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'delivery_guy', 'jobs_pending.html'));
});

// ---- JOBS API ----

// Load all jobs for front-end fetch
app.get('/api/jobs', isAuthenticated, async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'src', 'jobs.json'), 'utf8');
        const jobs = JSON.parse(data);
        deliveryJobs = jobs;
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: 'Could not load jobs' });
    }
});

// Assign job (manager)
app.post('/assign-job', isAuthenticated, hasRole('manager'), async (req, res) => {
    const { contactName, location, contactInfo, jobDescription } = req.body;
    const filePath = path.join(__dirname, 'src', 'jobs.json');

    try {
        let jobs = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            jobs = JSON.parse(data);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }

        const newJob = {
            id: uuidv4(),
            contactName,
            location,
            contactInfo,
            jobDescription,
            assignedTo: 'deliveryguy',
            status: 'pending'
        };

        jobs.push(newJob);
        await fs.writeFile(filePath, JSON.stringify(jobs, null, 2), 'utf8');
        deliveryJobs = jobs;

        res.redirect('/manager/jobs-assigned');
    } catch (err) {
        console.error('Failed to save job:', err);
        res.status(500).send('Server error');
    }
});

// Update job status (delivery guy)
app.post('/update-job-status', isAuthenticated, hasRole('deliveryguy'), async (req, res) => {
    const { id, status } = req.body;
    const filePath = path.join(__dirname, 'src', 'jobs.json');

    try {
        const jobs = JSON.parse(await fs.readFile(filePath, 'utf8'));
        const index = jobs.findIndex(job => job.id === id);
        if (index !== -1) {
            jobs[index].status = status;
            await fs.writeFile(filePath, JSON.stringify(jobs, null, 2), 'utf8');
            deliveryJobs = jobs;
        }

        res.redirect(status === 'complete' ? '/delivery-guy/jobs-done' : '/delivery-guy');
    } catch (err) {
        res.status(500).send('Failed to update job');
    }
});

// Delete job (manager)
app.post('/delete-job', isAuthenticated, hasRole('manager'), async (req, res) => {
    const { index } = req.body;
    const filePath = path.join(__dirname, 'src', 'jobs.json');

    try {
        const jobs = JSON.parse(await fs.readFile(filePath, 'utf8'));
        if (index >= 0 && index < jobs.length) {
            jobs.splice(index, 1);
            await fs.writeFile(filePath, JSON.stringify(jobs, null, 2), 'utf8');
            deliveryJobs = jobs;
        }
        res.redirect('/manager/jobs-assigned');
    } catch (err) {
        res.status(500).send('Failed to delete job');
    }
});

//deliveryguy apis
// All delivery jobs
app.get('/api/jobs/delivery/all', isAuthenticated, hasRole('deliveryguy'), async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'src', 'jobs.json'), 'utf8');
        const jobs = JSON.parse(data);
        const deliveryJobs = jobs.filter(job => job.assignedTo === 'deliveryguy');
        res.json(deliveryJobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load all jobs' });
    }
});

// Completed jobs
app.get('/api/jobs/delivery/done', isAuthenticated, hasRole('deliveryguy'), async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'src', 'jobs.json'), 'utf8');
        const jobs = JSON.parse(data);
        const doneJobs = jobs.filter(job => job.assignedTo === 'deliveryguy' && job.status === 'complete');
        res.json(doneJobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load completed jobs' });
    }
});

// Pending jobs
app.get('/api/jobs/delivery/pending', isAuthenticated, hasRole('deliveryguy'), async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'src', 'jobs.json'), 'utf8');
        const jobs = JSON.parse(data);
        const pendingJobs = jobs.filter(job => job.assignedTo === 'deliveryguy' && job.status === 'pending');
        res.json(pendingJobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load pending jobs' });
    }
});

app.get('/api/jobs/delivery', isAuthenticated, hasRole('deliveryguy'), async (req, res) => {
    try {
        const user = req.session.user;

        const jobsData = await fs.readFile(path.join(__dirname, 'src', 'jobs.json'), 'utf-8');
        const jobs = JSON.parse(jobsData);

        const assignedJobs = jobs.filter(job => job.assignedTo === user.username);

        res.json({ jobs: assignedJobs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }

    console.log('🔄 API: /api/jobs/delivery called by', req.session.user);

});



// --- Start server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});