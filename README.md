# 💬 Chatly — Real-Time Chat Application

Chatly is a full-stack real-time chat application built using the MERN stack. It provides a clean and responsive interface for users to connect, communicate, and manage their profiles.

## ✨ Features

- 🔐 **User Authentication** — Signup and login with password hashing and JWT-based authentication.
- 🍪 **Secure Cookie Authentication** — Uses HTTP-only cookies to manage authentication tokens.
- 💬 **Real-Time Messaging** — Instant communication powered by Socket.IO.
- 🟢 **Online Presence** — Track online users in real time.
- 👤 **User Profiles** — View and update profile information.
- 🖼️ **Profile Image Upload** — Upload and manage profile pictures.
- 📱 **Responsive UI** — Works across desktop and mobile screen sizes.
- 🔒 **Protected Routes** — Restrict access to authenticated users.

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- Tailwind CSS
- React Router
- Redux Toolkit
- Axios
- Socket.IO Client
- React Icons

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT (JSON Web Tokens)
- bcrypt.js
- Cookie Parser

## 🏗️ Project Structure

```text
Chatly/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── hooks/
│   │   └── config.js
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── socket.js
│   ├── index.js
│   └── package.json
│
└── README.md
```

*Note: Adjust the folder structure if your repository differs.*

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AkashRajshekhar/Chatly.git
cd Chatly
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

Use the exact environment variable names expected by your backend configuration.

Start the backend:

```bash
npm run dev
```

### 3. Set Up the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Configure the backend URL in your frontend configuration file, such as `src/config.js`:

```js
export const serverUrl = "http://localhost:8000";
```

Start the frontend:

```bash
npm run dev
```

Open the local URL provided by Vite in your terminal.

## 🌐 Deployment

Chatly is deployed using Render.

- **Frontend:** [Open Chatly](https://chatly-1-dqsq.onrender.com)
- **Backend:** [Backend API](https://chatly-p601.onrender.com)

For production, configure the frontend to use the deployed backend URL. Set the required environment variables in the hosting dashboard, and configure CORS to allow requests from your frontend origin.

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |

Never commit your `.env` file or expose your database credentials or JWT secret.

## 🔒 Security

- Passwords are hashed before being stored.
- Authentication uses JWT tokens stored in HTTP-only cookies.
- Protected API routes use authentication middleware.
- Production cookie and CORS settings must match the deployed frontend and backend origins.

## 📚 What I Learned

Building Chatly helped me practice:

- Developing REST APIs with Express.js.
- Implementing JWT authentication and password hashing.
- Connecting React frontend components to backend APIs.
- Managing global application state with Redux.
- Implementing real-time communication using Socket.IO.
- Handling authentication cookies and CORS in production.
- Deploying a full-stack application.

## 👨‍💻 Author

**Akash Rajshekhar**

- GitHub: [@AkashRajshekhar](https://github.com/AkashRajshekhar)

---

⭐ If you find this project interesting, consider giving the repository a star!
