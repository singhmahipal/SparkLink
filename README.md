<p align="center">
  <img src="https://via.placeholder.com/1200x300/000000/FFFFFF?text=SparkLink+-+Social+Media+App" alt="SparkLink Banner">
</p>

<h1 align="center">✨ SparkLink — Full-Stack Social Media App (MERN)</h1>

<p align="center">A modern social media platform built with the MERN stack, featuring authentication, stories, messaging, posts, profile management, connections, and real-time experiences.</p>

---

# 📌 Table of Contents
- [🚀 Overview](#-overview)
- [✨ Features](#-features)
- [🖼 Screenshots](#-screenshots)
- [🛠 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [⚙️ Environment Variables](#️-environment-variables)
- [🚀 Getting Started](#-getting-started)
- [📡 API Summary](#-api-summary)
- [🌐 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [⭐ Support](#-support)

---

# 🚀 Overview

SparkLink is a **full-stack social media application** built using the **MERN Stack**, equipped with:

- Real-time messaging  
- Stories & viewer  
- Post feed with images  
- Authentication (Clerk)  
- Media CDN (ImageKit)  
- Background jobs (Inngest)  
- Connections / Follow system  

It is built for learning, scaling, and production-ready deployment.

---

# ✨ Features

### 🔐 Authentication (Clerk)
- Signup / Login / Logout  
- Protected routes  
- Middleware-secured API  

### 💬 Real-time Messaging
- Chat UI  
- Recent messages panel  
- Smart notification popups  

### 📝 Posts & Feed
- Create post (text + image)  
- Feed algorithm  
- Post card components  

### 🕒 Stories System
- Story upload modal  
- Story viewer  
- Auto-expiry  

### 👥 Connections
- Follow / Unfollow  
- Pending requests  
- Discover page with suggestions  

### 📤 Media Uploads (ImageKit)
- Fast optimized CDN  
- Automatic compression  
- Upload via Multer  

### ⚙️ Inngest Background Jobs
- Webhooks  
- Notifications  
- Scheduled tasks  

---

# 🖼 Screenshots

> Replace these links with your real images later.

| Feed | Messaging | Profile |
|------|-----------|---------|
| ![Feed](https://via.placeholder.com/300) | ![Chat](https://via.placeholder.com/300) | ![Profile](https://via.placeholder.com/300) |

### 🎥 Demo GIF
> Add screen recording later  
![Demo](https://via.placeholder.com/800x400)

---

# 🛠 Tech Stack

### **Frontend**
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?logo=redux)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-0EA5E9?logo=tailwindcss)
![Clerk](https://img.shields.io/badge/Clerk-Auth-purple?logo=clerk)

### **Backend**
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-000000?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb)
![Inngest](https://img.shields.io/badge/Inngest-Blue?logo=serverless)
![ImageKit](https://img.shields.io/badge/ImageKit-CDN-blue)

---

# 📁 Project Structure

```

sparklink/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── vite.config.js
│   ├── package.json
│   └── vercel.json
│
└── server/
├── configs/
├── controllers/
├── inngest/
├── middlewares/
├── models/
├── routes/
├── utils/
├── server.js
├── package.json
└── vercel.json

```

---

# ⚙️ Environment Variables

### **Server `.env`**
```

PORT=5000
MONGO_URI=your_mongodb_uri

CLERK_SECRET_KEY=your_clerk_secret_key

IMAGEKIT_PUBLIC_KEY=your_public
IMAGEKIT_PRIVATE_KEY=your_private
IMAGEKIT_URL_ENDPOINT=your_url

INNGEST_EVENT_KEY=your_key

EMAIL_USER=your_email
EMAIL_PASS=your_pass

```

### **Client `.env`**
```

VITE_CLERK_PUBLISHABLE_KEY=your_key
VITE_API_URL=[http://localhost:5000](http://localhost:5000)

````

---

# 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/sparklink.git
````

### 2. Install dependencies

#### Client

```bash
cd client
npm install
```

#### Server

```bash
cd server
npm install
```

### 3. Run the App

#### Start Backend

```bash
npm run server
```

#### Start Frontend

```bash
npm run dev
```

---

# 📡 API Summary

### **Auth Middleware**

```
middlewares/auth.js
```

### **Endpoints**

#### 👤 User Routes

```
POST   /api/user/create
GET    /api/user/profile/:id
PUT    /api/user/update
```

#### 📝 Post Routes

```
POST   /api/post/create
GET    /api/post/feed
GET    /api/post/:id
```

#### 🕒 Story Routes

```
POST   /api/story/create
GET    /api/story/all
```

#### 💬 Message Routes

```
POST   /api/message/send
GET    /api/message/list/:userId
```

---

# 🌐 Deployment

### Supports:

* **Vercel** (recommended)
* Render
* Railway
* Netlify + Server Deployment
* AWS / Azure / DigitalOcean

Each folder includes its own:

```
vercel.json
```

---

# 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to **open a PR or issue**.

---

# ⭐ Support

If you like this project, please ⭐ star the repo — it motivates future updates!

---

<p align="center">
  Made with ❤️ using MERN Stack  
</p>
