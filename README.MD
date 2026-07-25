# 🐾 Paw Match Backend API

> A modern, secure, and scalable RESTful API that connects adopters with animal shelters, streamlines the adoption process, manages veterinary services, and provides administrators with complete platform control.

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Backend-000000?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-blue)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5)
![License](https://img.shields.io/badge/License-Educational-orange)

---

# 📖 About

Paw Match is a full-stack animal adoption platform designed to simplify and modernize the adoption process. The system connects adopters with animal shelters through a secure and user-friendly platform where users can search for animals, submit adoption requests, schedule veterinary appointments, receive personalized recommendations, and leave reviews.

The backend follows RESTful API principles and is built using modern technologies with a scalable architecture, secure authentication, role-based authorization, and cloud media management.

---

# ✨ Core Features

## 🔐 Authentication & Security

- User Registration
- Email Verification
- Secure Login
- Refresh Tokens
- Password Reset
- Change Password
- Profile Management
- JWT Authentication
- Role-Based Authorization
- Rate Limiting
- Secure Cookie Authentication
- Argon2 Password Hashing

---

## 🏠 Shelter Management

Shelter employees can:

- Create shelters
- Update shelter information
- Upload shelter images
- Manage shelter employees
- Manage shelter animals
- View adoption requests
- Reply to reviews

Super Admins can:

- Approve shelters
- Reject shelters
- Activate or deactivate shelters
- Permanently delete shelters
- Manage all shelters

---

## 🐶 Animal Management

Employees can:

- Add new animals
- Update animal information
- Upload multiple images
- Manage adoption status
- Restore deleted animals
- Archive animals

Users can:

- Browse available animals
- Search using filters
- View animal details

---

## ❤️ Adoption Workflow

The adoption process includes:

- Submit Adoption Request
- Review Request
- Interview Stage
- Home Check
- Approval
- Rejection
- Completion
- Cancellation

---

## 🩺 Veterinary Services

Adopters can:

- Book appointments
- View appointment history

Veterinarians can:

- View appointments
- Schedule appointments
- Update appointment status
- Complete consultations

---

## ⭐ Review System

Adopters can:

- Leave reviews
- Rate shelters
- Rate veterinarians
- Update reviews within the allowed period

Shelters and veterinarians can:

- Reply to reviews

---

## 🎯 Smart Matching

The platform provides intelligent animal recommendations based on:

- Animal preferences
- Living environment
- Experience level
- Lifestyle
- Activity level
- Family information

---

## 🔔 Notifications

Users receive notifications for:

- Adoption request updates
- Appointment updates
- Review replies
- Matching recommendations

---

# 👥 User Roles

## Super Admin

Has complete control over the platform including users, shelters, employees, veterinarians, approvals, and platform management.

---

## Shelter Employee

Responsible for managing shelters, animals, adoption requests, and responding to adopter reviews.

---

## Veterinarian

Responsible for veterinary appointments and communication with adopters.

---

## Adopter

Can browse animals, submit adoption requests, book veterinary appointments, receive recommendations, and leave reviews.

---

# 🛠️ Technology Stack

| Category | Technologies |
|-----------|--------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT |
| Password Hashing | Argon2 |
| File Storage | Cloudinary |
| Email Service | Nodemailer |
| Validation | Express Validator |
| Real-Time | Socket.IO |
| Cookies | Cookie Parser |

---

# 📁 Project Structure

```text
src
│
├── config
├── controllers
├── middlewares
├── models
├── routes
├── services
├── socket
├── utils
├── validations
├── uploads
└── app.js
```

---

# 🚀 Installation

Clone the repository

```bash
git clone <repository-url>
```

Navigate to the project

```bash
cd Paw-Match
```

Install dependencies

```bash
npm install
```

---

# ⚙️ Environment Variables

Create a `.env` file and configure the required environment variables.

```env
PORT=

NODE_ENV=

MONGODB_URL=

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=

ACCESS_TOKEN_EXPIRES_IN=
REFRESH_TOKEN_EXPIRES_IN=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

CLIENT_URL=
FRONTEND_URL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

# ▶️ Running the Backend

Start the backend development server.

```bash
npm run watch
```

---

# 🌐 Running the Public Website

```bash
cd frontend

npm run dev:public-web
```

---

# 🖥️ Running the Dashboard

```bash
cd frontend

npm run dev:dashboard
```

---

# 🌱 Seed Database

Populate the database with development and testing data.

```bash
npm run seed
```

---

# 📚 REST API Documentation

Complete API documentation is available on Postman.

**Postman Documentation**

https://documenter.getpostman.com/view/45221006/2sBY4QtLRK

---

# 📌 Main API Modules

The backend includes the following modules:

- Authentication
- Users
- Adopter Profiles
- Shelter Employee Profiles
- Veterinarian Profiles
- Shelters
- Animals
- Adoption Requests
- Veterinary Appointments
- Shelter Appointments
- Reviews
- Matching
- Notifications
- Uploads

---

# 🔒 Security Features

- JWT Authentication
- Refresh Token Rotation
- Role-Based Authorization
- Password Hashing using Argon2
- Request Validation
- HTTP-Only Cookies
- Secure File Upload
- Email Verification
- Password Reset
- Rate Limiting

---

# 🧪 Development

This project follows a modular architecture where each feature is organized into:

- Controller
- Model
- Route
- Validation
- Service
- Utility

This structure improves maintainability, scalability, and code organization.


---

# 👨‍💻 Development Team

This project was developed collaboratively by the **Paw Match Team**.

| Team Member | Role |
|------------|------|
| **Mustafa Rashid** | Team Leader • Backend Developer |
| **Arwa** | Backend Developer |
| **Zain** | Backend Developer |
| **Ali** | Backend Developer |
| **Amira** | Backend Developer |
| **Batoul** | Backend Developer |

---

## Project Supervisor

**Focal X**
