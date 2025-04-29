# 📦 TrackShip - Delivery Management System

TrackShip is a Node.js-based delivery management system designed for logistics operations. It includes role-based dashboards for Managers and Delivery Guys, supports job assignment, status updates, and tracks login/logout logs. Built with Express, MongoDB (Mongoose), Bootstrap 5, and static HTML views rendered dynamically via JavaScript.

---

## 🚀 Features

- 🔐 **Session-based Authentication** (Manager & Delivery Guy)
- 📋 **Assign and Manage Delivery Jobs**
- 📦 **Track Pending and Completed Deliveries**
- 📊 **Role-Specific Dashboards**
- 🧾 **Login/Logout History Logging**
- 🗂️ **MongoDB (Mongoose) Integration**
- 🎨 **Responsive UI with Bootstrap**

---

## 🧱 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas or Local)
- **Session Store**: connect-mongo
- **Frontend**: HTML5, Bootstrap 5, Font Awesome
- **Auth**: express-session
- **Templating**: Static HTML + Client-side JS (no EJS)

---

## 📁 Project Structure

```
TrackShip/
├── models/
│   ├── Job.js
│   ├── User.js
│   └── LoginLog.js
├── views/
│   ├── login.html
│   ├── manager/
│   │   └── dashboard.html, ...
│   └── delivery_guy/
│       └── dashboard.html, ...
├── public/
│   └── css/, js/, assets/
├── src/
│   └── jobs.json (legacy - being replaced by MongoDB)
├── db.js
├── app.js
├── .env
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/TrackShip.git
cd TrackShip
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup `.env` File

Create a `.env` file in the root:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/trackship
SECRET_KEY=someSuperSecret
```

### 4. Start MongoDB (if local)

```bash
mongod
```

Or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) with your cloud URI.

---

### 5. Run the Server

```bash
node app.js
```

Visit `http://localhost:3000`

---

## 👥 Roles

### 👨‍💼 Manager

- Assign new jobs
- View pending, assigned, and completed jobs

### 🚚 Delivery Guy

- View dashboard
- See assigned jobs
- Mark jobs as complete

---

## 📦 API Endpoints

### Manager

- `POST /assign-job`
- `POST /delete-job`
- `GET /api/jobs`

### Delivery Guy

- `GET /api/jobs/delivery`
- `POST /update-job-status`

---

## 🛠️ Future Improvements

- Switch all routes to MongoDB (remove jobs.json)
- Add JWT-based auth or OAuth
- Enable job reassignment
- Add notifications or reminders

---

## 📄 License

[MIT](LICENSE)
