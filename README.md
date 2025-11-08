# 🔗 URL Shortener Web Application

A full-stack **URL Shortener** built with **Express.js**, **EJS**, and **MySQL**, featuring secure **user authentication**, **email verification**, and **short link management**.  
This app lets users register, verify accounts via email, and generate short, shareable URLs that redirect to their original destinations.  
It’s designed as a hands-on learning project demonstrating real-world backend development, authentication, middleware handling, and deployment workflows.

---

## 🚀 Features

- ✉️ **Email Verification** – Ensures authentic user registration.  
- 🔒 **Authentication & Session Management** – Secure login system using `express-session` and cookies.  
- 🌐 **Dynamic EJS Views** – Fast, server-side rendered pages.  
- 🔗 **Custom Short Link Generation** – Create, copy, and manage URLs easily.  
- 💬 **Flash Messages** – Instant feedback for login, signup, and errors.  
- 🗄️ **MySQL Integration** – Reliable data storage via **Drizzle ORM**.  
- ☁️ **Deploy-Ready** – Works seamlessly on **Render**, **Heroku**, or any Node.js-compatible PaaS.

---

## 🛠️ Tech Stack

| Category | Technology |
|-----------|-------------|
| Backend Framework | **Express.js** |
| Templating Engine | **EJS** |
| Database | **MySQL** |
| ORM | **Drizzle ORM** |
| Authentication | **express-session**, **cookie-parser**, **connect-flash** |
| Email Service | **Nodemailer** (for verification links) |
| Hosting | Render / Heroku |

---

## ⚙️ Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
2. Install Dependencies
    ```bash
   npm install
4. Set Environment Variables
   
5. Run the App
    ```bash
   npm run server
  
