# TalentBridge

An AI-powered recruitment platform that streamlines the hiring process for both recruiters and job seekers. TalentBridge leverages AI-based resume parsing and ATS scoring to help candidates understand how well they match a job while enabling recruiters to quickly identify the most suitable applicants.

---

## Overview

Traditional hiring platforms often create challenges for both applicants and recruiters. Candidates have little visibility into whether their resumes align with job requirements, while recruiters spend significant time reviewing applications that may not meet the desired qualifications.

TalentBridge addresses these challenges by providing intelligent resume analysis, automated ATS scoring, and a centralized recruitment workflow.

---

## Tech Stack

### Frontend
- Angular 19
- TypeScript
- HTML5
- CSS3

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### APIs & Services
- Google Gemini API (Resume Parsing & ATS Analysis)
- Google OAuth 2.0 (Authentication)
- Cloudinary (Resume & Image Storage)
- Nodemailer (Email Verification & Password Reset)

---

## Features

### Recruiter

- Recruiter authentication
- Create, update, and delete job postings
- View all applicants
- AI-generated ATS score for every application
- Resume preview and download
- Manage candidate status
  - Pending
  - Reviewed
  - Shortlisted
  - Rejected
- Recruiter dashboard with job statistics

### Job Seeker

- User authentication
- Google Sign-In
- Create and manage profile
- Upload resume
- Browse available jobs
- One-click job application
- Instant ATS match score
- View matched and missing keywords
- Track application status

### Admin

- Secure admin authentication
- Manage recruiters
- Manage job seekers
- Monitor job postings
- Access platform management dashboard

---

## AI Features

- Resume PDF parsing using Google Gemini
- ATS compatibility scoring
- Job description comparison
- Keyword matching analysis
- Missing skill identification
- Resume feedback generation

---

## Project Structure

```
TalentBridge/
│── frontend/          # Angular Application
│── backend/           # Express.js API
│── models/            # MongoDB Models
│── routes/            # API Routes
│── controllers/       # Business Logic
│── middleware/        # Authentication & Validation
│── services/          # AI & External APIs
│── uploads/           # Temporary Files
│── README.md
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/TalentBridge.git
cd TalentBridge
```

### 2. Install Dependencies

Backend

```bash
cd backend
npm install
```

Frontend

```bash
cd frontend
npm install
```

---

## Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GOOGLE_CLIENT_ID=your_google_client_id

EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

---

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

### Start Frontend

```bash
cd frontend
ng serve
```

The application will be available at:

```
Frontend: http://localhost:4200
Backend:  http://localhost:5000
```

---

## Admin Login

Use the following credentials to access the Admin Dashboard.

| Field | Value |
|--------|-------|
| URL | `http://localhost:4200/admin/login` |
| Email | `admin@jobportal.com` |
| Password | `adminpassword123` |

---

## Future Enhancements

- AI interview assistant
- Video interview scheduling
- Resume improvement suggestions
- Company analytics dashboard
- Email notifications
- Real-time chat between recruiters and candidates
- Advanced filtering and search
- Job recommendations using AI

---

## Contributors

Developed as a Hackathon Project.

---

## License

This project is intended for educational and hackathon purposes.

#video link
https://drive.google.com/drive/folders/1-ARIe7pO1dXkPTQOfRhJa21thjTUrTop?usp=sharing
