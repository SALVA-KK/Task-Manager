# Task Manager

A full-stack task manager. Users sign up, log in, and manage their own tasks.
Built with Django REST Framework, PostgreSQL and React (Vite).

## Features
- Sign up with email and password, log in, log out
- Create, view, edit and delete tasks (title, description, due date, priority, status)
- Filter by status, search by title, and change status from the list
- Tick a checkbox to mark a task complete
- Pagination (10 tasks per page)
- Delete confirmation, loading states and clear error messages
- Validation on both the frontend and the backend
- Each user only sees their own tasks
- 16 backend tests
- Docker Compose setup

## Tech stack
Django 5.2, Django REST Framework, PostgreSQL, React 18+ (Vite), Python 3.10+, Node 18+.

## Setup (local)

### 1. Database
In `psql` as the `postgres` user:
```sql
CREATE USER mytaskuser WITH PASSWORD 'your-password';
CREATE DATABASE mytaskmanager OWNER mytaskuser;
ALTER USER mytaskuser CREATEDB;
```
`CREATEDB` is needed so `manage.py test` can create a temporary test database.

### 2. Environment variables
Copy `.env.example` to `.env` in the project root and fill in `DJANGO_SECRET_KEY` and `DB_PASSWORD`:
```bash
cp .env.example .env          # Windows: copy .env.example .env
```
Generate a secret key with:
```bash
python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"
```
Also copy it to `frontend/.env` (only `VITE_API_URL` is used there).

### 3. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate         # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver    # http://localhost:8000
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

## Run with Docker
Requires Docker Desktop (engine running). From the project root:
```bash
cp .env.example .env          # then set DJANGO_SECRET_KEY and DB_PASSWORD
docker compose up --build
```
- App: http://localhost:5173
- API: http://localhost:8000/api

Stop with `Ctrl+C`, then `docker compose down`. Add `-v` to also delete the database data.

Notes:
- Compose runs the Django and Vite dev servers, which is fine for review but not production.
- Compose sets `DB_HOST=db` for the backend. The local setup keeps `DB_HOST=localhost`.
- Postgres only reads its password when the volume is first created. If you change `DB_PASSWORD` later, run `docker compose down -v` first.

## Tests
```bash
cd backend
python manage.py test
```
The 16 tests cover signup, login, logout, validation, access control (another user's task returns 404), filter, search, and pagination.

## API
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/signup/` | No | 201 with token |
| POST | `/api/auth/login/` | No | 200 with token, 401 on bad credentials |
| POST | `/api/auth/logout/` | Yes | 204, deletes the token |
| GET | `/api/tasks/` | Yes | `?status=`, `?search=`, `?page=`. Returns `count`, `next`, `previous`, `results` |
| POST | `/api/tasks/` | Yes | 201 |
| GET, PATCH, PUT, DELETE | `/api/tasks/{id}/` | Yes | 404 if the task isn't yours |


## Decisions and trade-offs
- **DRF Token instead of JWT:** Tokens are simple to set up, and logging out really deletes the token on the server. The downside is one database lookup per request, and the token never expires.
- **Token in localStorage:** It's easy to use and survives a page refresh. The risk is that an XSS bug could read it. Cookies would be safer but need extra CSRF handling.
- **404 instead of 403 for other users' tasks:** Tasks are filtered by the logged-in user. Someone else's task is simply not found, so the API doesn't reveal that it exists.
- **Email as the username:** I used Django's built-in User and stored the lowercased email as the username. That avoided writing a custom user model.
- **Filtering and search on the server:** The database does the filtering. The search box waits 300ms after typing, so it doesn't send a request for every letter.
- **Page size:** The page size of 10 is set in the backend. The frontend repeats the number to work out how many pages there are. It would be cleaner to read it from the API.
- **Docker uses dev servers:** It runs the whole project with one command. It is meant for review, not for production.