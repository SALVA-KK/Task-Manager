# Task Manager

A full-stack task management app. Users sign up, log in, and manage their own tasks.

**Stack:** Django + Django REST Framework, PostgreSQL, React (Vite).

## Features
- Sign up with email and password, log in (DRF token), log out (token deleted server-side)
- Passwords hashed with Django's default hasher
- Create, view, edit and delete tasks: title (required), description, due date, priority (Low/Medium/High), status (To Do/In Progress/Done)
- Filter by status, search by title, change status from the list
- Delete confirmation, loading indicators, clear error messages
- Validation on both the frontend and the backend
- Each user only sees and edits their own tasks (other users' task IDs return 404)
- Backend tests for auth, validation, per-user access, filter and search

## Prerequisites
Python 3.10+, Node 18+, PostgreSQL, Git.

## Setup

### 1. Database
In `psql` as a superuser:
```sql
CREATE USER mytaskuser WITH PASSWORD 'your-password';
CREATE DATABASE mytaskmanager OWNER mytaskuser;
ALTER USER mytaskuser CREATEDB;  -- lets the test runner create a test database
```

### 2. Environment variables
```bash
cp .env.example .env            # then fill in DJANGO_SECRET_KEY and DB_PASSWORD
cp .env.example frontend/.env   # only VITE_API_URL is used here
```
Generate a secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"
```

### 3. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate           # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver      # http://localhost:8000
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

## Running the tests
```bash
cd backend
python manage.py test
```

## API
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/signup/` | No | 201 with token |
| POST | `/api/auth/login/` | No | 200 with token, 401 on bad credentials |
| POST | `/api/auth/logout/` | Yes | 204 |
| GET, POST | `/api/tasks/` | Yes | `?status=todo&search=text` |
| GET, PATCH, PUT, DELETE | `/api/tasks/{id}/` | Yes | 404 if the task isn't yours |

## Design decisions and trade-offs
- **DRF Token vs JWT:** (write your own reason here, e.g. simpler, and logout really revokes the token. Downside: a database lookup per request and no expiry.)
- **Token in localStorage:** simple, but readable by JavaScript if the site has an XSS bug. httpOnly cookies are safer but need CSRF handling.
- **404 instead of 403 for other users' tasks:** the queryset is filtered by owner, so the API doesn't reveal that an ID exists.
- **Email as username:** uses Django's built-in User instead of a custom user model, to keep the scope small.
- **Filtering and search in the database:** done server-side so it scales, with a debounce on search to limit requests.

## What I would improve with more time
- Pagination, categories or tags, Docker Compose
- Token expiry or JWT refresh, and rate limiting on login
- Frontend tests
- A custom user model with a unique email field
- Replace `window.confirm` with a proper modal