# 🍽️ IIIT Bhubaneswar Mess Management System

A full-stack web application for managing the mess/cafeteria at IIIT Bhubaneswar. Built with **HTML/CSS/JavaScript** (frontend) and **TypeScript/Node.js/Express** (backend).

![Dark Theme](https://img.shields.io/badge/Theme-Dark%20Aesthetic-0f0f1a?style=for-the-badge&labelColor=1a1a2e)
![TypeScript](https://img.shields.io/badge/Backend-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Server-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Node.js](https://img.shields.io/badge/Runtime-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)

---

## ✨ Features

### 👨‍🎓 Student Dashboard
- **Weekly Menu** — Browse the full Mon–Sun menu with tabs for each meal slot
- **Today's Highlight** — See what's being served today at a glance
- **Meal Registration** — Opt-in or skip upcoming meals with toggle switches
- **Feedback & Ratings** — Submit star ratings and comments for each meal
- **Announcements** — Stay updated with mess notices and special events

### 👨‍💼 Admin Dashboard
- **Dashboard Stats** — Total students, today's registrations, avg rating, total feedback
- **Charts & Analytics** — Visual bar charts for meal distribution and rating breakdown
- **Menu Management** — Add, edit, and update items & timings for each day
- **Student Directory** — View all registered students with details
- **Feedback Viewer** — See all feedback with filters by meal type and rating
- **Announcements** — Create, prioritize, and delete announcements

### 🎨 Design
- **Dark aesthetic theme** with navy-black backgrounds and red-pink accents
- **Glassmorphism** card surfaces with subtle borders
- **Particle animation** background on the landing page
- **Smooth transitions** and entrance animations
- **Fully responsive** — works on desktop, tablet, and mobile

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd IWT

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start
```

The app will be running at **http://localhost:3000**

### Development Mode

```bash
npm run dev
```

This uses `ts-node` to run TypeScript directly without building.

---

## 🔐 Default Login Credentials

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@iiitbh.ac.in     | admin123    |
| Student | swaraj@iiitbh.ac.in    | student123  |
| Student | rahul@iiitbh.ac.in     | student123  |
| Student | priya@iiitbh.ac.in     | student123  |

---

## 📁 Project Structure

```
IWT/
├── public/                    # Frontend (static files)
│   ├── index.html             # Landing page
│   ├── student.html           # Student dashboard
│   ├── admin.html             # Admin dashboard
│   ├── css/
│   │   └── style.css          # Global dark-theme stylesheet
│   └── js/
│       ├── utils.js           # Shared utilities (API, toast, helpers)
│       ├── auth.js            # Authentication logic
│       ├── student.js         # Student dashboard logic
│       └── admin.js           # Admin dashboard logic
├── src/                       # Backend (TypeScript)
│   ├── server.ts              # Express entry point
│   ├── middleware/
│   │   └── auth.ts            # Token auth & admin guard
│   ├── routes/
│   │   ├── auth.ts            # Login / Register / Logout
│   │   ├── menu.ts            # Menu CRUD
│   │   ├── feedback.ts        # Feedback submission & retrieval
│   │   ├── meals.ts           # Meal registration
│   │   ├── announcements.ts   # Announcement CRUD
│   │   └── students.ts        # Student list & stats
│   ├── utils/
│   │   └── fileStore.ts       # JSON file read/write utility
│   └── data/                  # JSON "database" files
│       ├── users.json
│       ├── menu.json
│       ├── feedback.json
│       ├── meals.json
│       └── announcements.json
├── package.json
├── tsconfig.json
└── .gitignore
```

---

## 🛠️ Tech Stack

| Layer      | Technology                           |
|------------|--------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript      |
| Backend    | TypeScript, Node.js, Express.js      |
| Storage    | JSON file-based (no external DB)     |
| Auth       | Bearer token (in-memory sessions)    |
| Styling    | Custom CSS with CSS Variables        |

---

## 📡 API Endpoints

| Method | Endpoint                 | Auth     | Description               |
|--------|--------------------------|----------|---------------------------|
| POST   | `/api/auth/login`        | Public   | Login                     |
| POST   | `/api/auth/register`     | Public   | Register student          |
| GET    | `/api/auth/me`           | Bearer   | Get current user          |
| POST   | `/api/auth/logout`       | Bearer   | Logout                    |
| GET    | `/api/menu`              | Public   | Full weekly menu          |
| GET    | `/api/menu/today`        | Public   | Today's menu              |
| PUT    | `/api/menu/:day`         | Admin    | Update day's menu         |
| POST   | `/api/feedback`          | Bearer   | Submit feedback           |
| GET    | `/api/feedback`          | Bearer   | Get feedback (filtered)   |
| GET    | `/api/feedback/my`       | Bearer   | Get own feedback          |
| POST   | `/api/meals/register`    | Bearer   | Register/skip meal        |
| GET    | `/api/meals/my`          | Bearer   | Get own registrations     |
| GET    | `/api/announcements`     | Public   | Get all announcements     |
| POST   | `/api/announcements`     | Admin    | Create announcement       |
| DELETE | `/api/announcements/:id` | Admin    | Delete announcement       |
| GET    | `/api/students`          | Admin    | List all students         |
| GET    | `/api/students/stats`    | Admin    | Dashboard statistics      |

---

## 👤 Author

**Swaraj Sarkar**
IIIT Bhubaneswar

---

## 📄 License

This project is licensed under the MIT License.
