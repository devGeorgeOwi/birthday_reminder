# 🎂 Birthday Reminder App

A full‑stack **Birthday Reminder System** built with Node.js, Express, and PostgreSQL.  
It automatically sends birthday emails at 7am using a cron job, processes emails through a Bull queue with retry logic, and includes a complete authentication system (email verification, password reset).  
The entire application is containerised with Docker.

---

## ✨ Features

- **User registration** with email verification (real email via Gmail SMTP)
- **Password reset** flow with secure reset tokens
- **Daily cron job** (7am) – checks for today’s birthdays and sends celebratory emails
- **Background job queue** with **Bull** and **Redis** – retries failed email deliveries
- **Webhook callback** – logs email send status internally
- **CLI tool** – add verified users from the command line
- **Advanced testing** – unit + integration tests with mocked database & queue
- **Containerised** with Docker & Docker Compose (PostgreSQL, Redis, App)

---

## 🛠️ Tech Stack

| Technology   | Purpose                              |
|--------------|--------------------------------------|
| Node.js      | Backend runtime                      |
| Express      | Web framework                        |
| PostgreSQL   | Database                             |
| Redis        | Queue backend                        |
| Bull         | Job queue with retries               |
| node-cron    | Daily birthday check                 |
| Nodemailer   | Real email sending (Gmail SMTP)      |
| EJS          | Server‑side templates (UI)           |
| bcrypt       | Password hashing                     |
| jsonwebtoken | JWT for login sessions               |
| commander    | CLI command parser                   |
| Jest         | Testing framework                    |
| Supertest    | HTTP assertions                      |
| Docker       | Containerisation                     |

---

## 📁 Project Structure

birthday-reminder/
├── .env # environment variables (not committed)
├── .gitignore
├── package.json
├── Dockerfile
├── docker-compose.yml
├── src/
│ ├── server.js # Express server setup
│ ├── db.js # PostgreSQL pool & schema initialisation
│ ├── auth.js # Authentication routes (signup, login, reset, verify)
│ ├── queue.js # Bull queue setup & job processor
│ ├── mailer.js # Email transporter (Gmail SMTP)
│ ├── cronJob.js # Scheduled birthday checker
│ ├── cli.js # CLI tool to add users
│ └── views/
│ ├── index.ejs
│ ├── signup.ejs
│ ├── login.ejs
│ ├── forgot-password.ejs
│ └── reset-password.ejs
└── tests/
└── app.test.js


---

## 🚀 Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- Docker Desktop (or Docker Engine + Docker Compose)
- A Gmail account with 2‑Step Verification enabled and an **App Password** generated

### 1. Clone & Install

```bash
git clone https://github.com/devGeorgeOwi/birthday_reminder
cd birthday_reminder
npm install

```
### 2. Environment Variables
Create a `.env` file in the project root (copy the template below and fill in your details):
  
# Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM="Birthday Reminder <your_email@gmail.com>"

# Server
PORT=3000
APP_BASE_URL=http://localhost:3000

# PostgreSQL
DB_USER=postgres
DB_PASSWORD=secret
DB_HOST=localhost
DB_PORT=5432
DB_NAME=birthday_reminder

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=change_this_to_a_long_random_string
BCRYPT_SALT_ROUNDS=10

### 3. Start PostgreSQL & Redis with Docker

```bash
docker compose up -d postgres redis
```

### 4. Start the App

```bash
npm run dev
```
Visit `http://localhost:3000` – the UI is live.


## 🐳 Running with Docker Compose (Full Stack)

To build and run the entire stack (app + DB + Redis):

```bash
docker compose up --build
```

Stop with `Ctrl+C` and then `docker compose down`.
Add `-v` to remove database volumes: `docker compose down -v`

## 📧 Sending Real Emails

The app uses Gmail SMTP with an App Password.
Generate one at https://myaccount.google.com/apppasswords (requires 2‑Step Verification).
Enter it as EMAIL_PASS in your `.env` file.

> **⚠️ If you want to use Brevo or another SMTP provider, update src/mailer.js and the respective environment variables.

## 🧪 Testing

```bash
npm test
```
Tests mock the database pool and the queue to verify:
- User signup (success + duplicate email)
- Cron birthday query logic
- Queue job processing (requires mocking the mailer)

Add more tests as needed.

## 🔧 CLI Command

Add a verified user directly:

```bash
npm run cli-add -- -u "Name" -e "name@example.com" -d "1995-12-25" -p "SecurePass"
```
The user is created with is_verified = true and can login immediately.

## ⏰ Testing the Birthday Cron

For quick testing, change the cron expression in `src/cronJob.js` to `'* * * * *'` (every minute).
Set a user’s birthday to today:

```bash
docker exec -i <postgres-container> psql -U postgres -d birthday_reminder -c "UPDATE users SET date_of_birth = CURRENT_DATE WHERE email = 'user@example.com';"
```
Watch the server logs and your inbox. Remember to change the cron back to `'0 7 * * *'` afterwards.

## 🌐 Deployment

### Option 1: Render (Free – Recommended)

Render’s free tier does not block SMTP ports and allows outbound emails.
1. Push your code to a GitHub repository.
2. Create a new Web Service on Render, connect the repo.
3. Select Docker as the environment.
4. Add all `.env` variables in Render’s Environment section.
5. Render builds your Dockerfile and deploys.
6. Your app will be available at `https://your-app.onrender.com`.

> ** Note: For the database, you can either use Render’s free PostgreSQL/Redis add‑ons or keep
>  them inside Docker – but Render’s free tier only supports one service, so it’s best to use their
>  managed add‑ons and only deploy your Node app container.

### Option 2: VPS (DigitalOcean, Linode, AWS EC2)

1. Provision an Ubuntu VPS.
2. Install Docker and Docker Compose.
3. Clone your repo, set up `.env`.
4. Run docker `compose up -d --build`.
5. Open port 3000 in the firewall.

Make sure the VPS provider allows outbound SMTP traffic (most unmanaged VPS do).

## ⚠️ SMTP Blocking on Some Hosts

Many free hosting platforms (Heroku, Vercel, Netlify) block port 25/587 for outbound SMTP, so 
emails will not work.
Always test your email flows after deployment. If you encounter blocks, use a transactional email
service like Brevo, SendGrid, or Mailgun, which offer HTTP APIs that bypass SMTP
port restrictions.

## 📬 API Endpoints

<table style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
  <tr style="border-bottom: 2px solid black;">
    <th style="border: none; text-align: left; padding: 8px;">Method</th>
    <th style="border: none; text-align: left; padding: 8px;">Path</th>
    <th style="border: none; text-align: left; padding: 8px;">Description</th>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="border: none; padding: 8px;">GET</td>
    <td style="border: none; padding: 8px;">/</td>
    <td style="border: none; padding: 8px;">Home page</td>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="border: none; padding: 8px;">GET</td>
    <td style="border: none; padding: 8px;">/signup</td>
    <td style="border: none; padding: 8px;">Signup form</td>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="border: none; padding: 8px;">POST</td>
    <td style="border: none; padding: 8px;">/signup</td>
    <td style="border: none; padding: 8px;">Create new user</td>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="border: none; padding: 8px;">GET</td>
    <td style="border: none; padding: 8px;">/verify-email</td>
    <td style="border: none; padding: 8px;">Verify email with token</td>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="border: none; padding: 8px;">GET</td>
    <td style="border: none; padding: 8px;">/login</td>
    <td style="border: none; padding: 8px;">Login form</td>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="border: none; padding: 8px;">POST</td>
    <td style="border: none; padding: 8px;">/login</td>
    <td style="border: none; padding: 8px;">Authenticate user, get JWT</td>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="border: none; padding: 8px;">GET</td>
    <td style="border: none; padding: 8px;">/forgot-password</td>
    <td style="border: none; padding: 8px;">Forgot password form</td>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="border: none; padding: 8px;">POST</td>
    <td style="border: none; padding: 8px;">/forgot-password</td>
    <td style="border: none; padding: 8px;">Request password reset</td>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="border: none; padding: 8px;">GET</td>
    <td style="border: none; padding: 8px;">/reset-password</td>
    <td style="border: none; padding: 8px;">Reset password form (GET)</td>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="border: none; padding: 8px;">POST</td>
    <td style="border: none; padding: 8px;">/reset-password</td>
    <td style="border: none; padding: 8px;">Update password</td>
  </tr>
  <tr style="border-bottom: 1px solid #ccc;">
    <td style="border: none; padding: 8px;">POST</td>
    <td style="border: none; padding: 8px;">/webhook/email-status</td>
    <td style="border: none; padding: 8px;">Internal webhook (email log)</td>
  </tr>
</table>

## 🎯 What This Project Demonstrates

- ✅ Cron Jobs (node-cron)

- ✅ Background Workers & Queues (Bull + Redis)

- ✅ Commands (CLI)

- ✅ Callbacks/Webhooks

- ✅ Advanced Testing (Jest + mocks)

- ✅ Containerisation (Docker + Docker Compose)

This project was built as a final‑semester assignment for a Node.js diploma course.

## 📝 License

MIT – feel free to use and modify.


---

## Deployment Guide (Render)

1. **Push your project to GitHub** (make sure `.env` is **not** committed – `.gitignore` already handles this).
2. Sign up at [render.com](https://render.com) (free account).
3. Click **New +** → **Web Service** → connect your GitHub repo.
4. Configure:
   - **Runtime:** Docker
   - **Build Command:** *(leave empty – Dockerfile handles it)*
   - **Start Command:** *(leave empty – CMD in Dockerfile)*
5. In the **Environment Variables** section, add **all** the variables from your `.env`:
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
   - `APP_BASE_URL=https://your-app.onrender.com` (important – update this to the actual URL)
   - `JWT_SECRET`, `BCRYPT_SALT_ROUNDS`
   - For database: use Render’s managed PostgreSQL/Redis (or keep them in Docker but note Render free tier only runs one container)
6. Deploy. After a few minutes, your app is live.

> **SMTP works** on Render because it does not block outbound mail ports.

---

## Alternatives if SMTP is Blocked

If you ever host on a platform that blocks SMTP (e.g., Vercel, Heroku free), simply swap the mailer to a HTTP‑based API like **Brevo** (formerly Sendinblue) or **SendGrid**. The rest of the app doesn’t change.  
I already have a Brevo mailer version ready if you ever need it.

---

You now have a professional README and a clear deployment path. Would you like me to guide you through the **Render deployment step‑by‑step live**, or is there anything else you'd like to polish (e.g., more tests, a demo video, or a `LICENSE` file)?
