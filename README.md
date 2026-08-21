# QueryCrest Full-Stack Onboarding Task

## Overview

This project is a two-page application management system developed as part of the QueryCrest Full-Stack Developer onboarding task.

The application demonstrates secure authentication, server side validation, rate limiting, account lockouts, JWT-based authentication, and application management using Supabase Edge Functions.

## Features

* User signup and login
* Server-side input validation
* Supabase Authentication
* Supabase Edge Functions
* JWT-based authentication
* Login attempt tracking
* Account lockout and rate limiting
* Application creation and retrieval
* Draft and submitted application statuses
* Row Level Security (RLS)
* Session-based authentication
* Frontend/backend separation
* Approved institution validation

## Technologies Used

* HTML5
* CSS
* JavaScript
* TypeScript
* Deno
* Supabase
* Supabase Edge Functions
* Git
* GitHub

## Architecture Overview

The application consists of two frontend pages and two Supabase Edge Functions.

```text
Browser
│
├── index.html
│   └── auth.js
│       │
│       ▼
│   auth-handler
│       │
│       ├── Supabase Auth
│       ├── profiles
│       ├── login_attempts
│       └── account_lockouts
│
└── dashboard.html
    └── dashboard.js
        │
        ▼
    applications-handler
        │
        └── applications
```

### Authentication Flow

1. A user signs up or logs in through `index.html`.
2. `auth.js` sends the request to the `auth-handler` Edge Function.
3. The Edge Function performs server-side validation and authentication.
4. Successful login returns a JWT access token.
5. The frontend stores the token in `sessionStorage` as `qc_token`.
6. The dashboard uses the token when communicating with `applications-handler`.

### Application Flow

1. `dashboard.html` loads the application manager.
2. `dashboard.js` retrieves the JWT from `sessionStorage`.
3. Requests are sent to `applications-handler` with the JWT.
4. The Edge Function verifies the authenticated user.
5. Applications are created and retrieved for the authenticated user.

## Project Structure
qc-onboarding-task/
index.html
dashboard.html
style.css
auth.js
README.md
supabase/functions/
 auth-handler/index.ts
 applications-handler/index.ts

## Supabase Project

Supabase Project URL:
```text
https://bsywozoqkyjstsowbmel.supabase.co
```

No Supabase secret keys or service-role credentials are included in this README.

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Khuloana/qc-onboarding-task.git
cd qc-onboarding-task
```

### 2. Configure Supabase

Create or connect the project to Supabase and configure the required database tables and Edge Functions.

The required Edge Functions are:

```text
auth-handler
applications-handler
```

### 3. Configure Supabase secrets

The Edge Functions require the appropriate Supabase configuration and secrets to be configured through the Supabase project.

Secrets must not be placed inside frontend JavaScript files or committed to GitHub.

### 4. Deploy the Edge Functions

```bash
supabase functions deploy auth-handler --no-verify-jwt
supabase functions deploy applications-handler --no-verify-jwt
```

### 5. Run the application

Open `index.html` in a browser using a local development server.

The application starts on the login/signup page. After successful authentication, the user is redirected to the application dashboard.

## Security

The project follows the requirement that sensitive backend credentials and business logic are not exposed to the browser.

The Supabase service-role key and other secrets are kept server-side and are accessed only by the Edge Functions.

Row Level Security is enabled on the database tables.

## Screenshots

### Login / Signup Page and Application Dashboard

>QueryCrest Login and Signup Page(screenshots/login.png)

>QueryCrest Application Dashboard(screenshots/dashboard.png)

## Testing

The application was tested for:

* User signup
* User login
* JWT session handling
* Application creation
* Draft applications
* Submitted applications
* Application retrieval after logout and login
* Invalid authentication attempts
* Account lockout progression
* Institution validation
* Frontend authentication redirects
* Logout functionality

## Repository

The completed project is maintained in the GitHub repository:

`Khuloana/qc-onboarding-task`
