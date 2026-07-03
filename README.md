# Smart Crowd Monitoring and Ration Resource Information System

## Phase 1 Overview
This repository contains the foundational Phase 1 code for the Smart Crowd Monitoring and Ration Resource Information System. It includes the React frontend (Vite + Tailwind CSS) and the Python Flask backend with a MySQL database setup.

## Setup Instructions

### 1. Database
- Ensure MySQL is running.
- Execute `database/schema.sql` to set up the initial schema and dummy data.
  ```bash
  mysql -u root -p < database/schema.sql
  ```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
