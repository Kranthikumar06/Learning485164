# Secure My Campus

A web-based complaint management system for Anurag University that enables students to submit and track complaints, while faculty and administrators can manage and resolve them efficiently.

## Features

- **User Authentication** – Sign up / Sign in with email & password or Google OAuth (restricted to `@anurag.edu.in` addresses)
- **Role-Based Access** – Three roles: `student`, `faculty`, and `admin`, each with different permissions
- **Complaint Submission** – Students can file complaints with supporting details
- **Dashboard** – View and manage complaints; admins can see system-wide statistics
- **AI Chatbot** – Powered by Google Gemini to assist users with queries
- **Email Notifications** – Verification emails and complaint status updates via SendGrid / Nodemailer
- **Toast Notifications** – Smooth, non-intrusive in-app notifications (see [NOTIFICATION_SYSTEM.md](NOTIFICATION_SYSTEM.md))
- **Feedback System** – Users can submit feedback about the platform
- **Profile Management** – Edit profile and change password

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend (main) | Node.js, Express.js |
| Templating | Jade (Pug) |
| Database | MongoDB (Mongoose) |
| Authentication | JWT, Passport.js, Google OAuth 2.0 |
| AI Chatbot | Python, Flask, Google Gemini API |
| Email | SendGrid, Nodemailer |
| Security | Helmet, bcrypt |

## Project Structure

```
├── app.js                  # Express application entry point
├── app.py                  # Flask AI chatbot server
├── bin/www                 # HTTP server bootstrap
├── mongo.js                # MongoDB connection
├── models/
│   ├── User.js             # User schema (student / faculty / admin)
│   ├── Complaint.js        # Complaint schema
│   ├── Dashboard.js        # Dashboard data schema
│   └── Feedback.js         # Feedback schema
├── app_server/
│   ├── routes/
│   │   ├── index.js        # Home route
│   │   ├── pages.js        # Complaint, dashboard, profile routes
│   │   └── users.js        # Auth & user management routes
│   └── views/              # Jade templates
├── public/                 # Static assets (CSS, JS, images)
└── add_dashboard_data.js   # Utility script to seed dashboard data
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB instance (local or Atlas)
- Python 3.8+ (for the AI chatbot)
- Google Cloud OAuth credentials
- SendGrid API key (for email)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Kranthikumar06/Learning485164.git
   cd Learning485164   # Repository folder name
   ```

2. **Install Node.js dependencies**

   ```bash
   npm install
   ```

3. **Install Python dependencies**

   ```bash
   pip install flask flask-cors google-generativeai
   ```

4. **Configure environment variables**

   Create a `.env` file in the project root:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   BASE_URL=http://localhost:3000
   SESSION_SECRET=your_session_secret
   SENDGRID_API_KEY=your_sendgrid_api_key
   ```

### Running the Application

**Start the Node.js server:**

```bash
npm start
```

The application will be available at `http://localhost:3000`.

**Start the AI chatbot server (optional):**

```bash
python app.py
```

## Usage

1. Open `http://localhost:3000` in your browser.
2. Sign up using your `@anurag.edu.in` email address (or use Google Sign-In).
3. Verify your email address.
4. Log in and submit a complaint via the **Complaint Form**.
5. Track the status of your complaints on the **Dashboard**.
6. Admins can update complaint statuses and view system statistics.

## Documentation

- [Dashboard Feature](DASHBOARD_FEATURE.md) – Details about the dashboard collection and API
- [Notification System](NOTIFICATION_SYSTEM.md) – Toast notification API reference and usage guide
