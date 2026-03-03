# SMAART EMR (Backend + Web Frontend)

Production-style Hospital EMR system with:
- `smaart-emr-backend` (Node.js + Express + MongoDB)
- `smaart-emr-frontend` (React + Vite + Tailwind)

This repo supports role-based flows for Admin, Nurse, Physio/Consultant, and Patient.

## 1. Prerequisites

- Node.js 18+ (recommended 20+)
- npm 9+
- MongoDB (local or cloud)

## 2. Project Structure

```text
.
├── smaart-emr-backend
└── smaart-emr-frontend
```

## 3. Backend Setup

1. Open backend folder:
```bash
cd smaart-emr-backend
```

2. Create or update `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smaart_emr
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

3. Install deps and run:
```bash
npm install
npm run dev
```

Backend default API base:
`http://localhost:5000/api`

## 4. Frontend Setup

1. Open frontend folder:
```bash
cd smaart-emr-frontend
```

2. Create/update `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

3. Install deps and run:
```bash
npm install
npm run dev
```

Frontend default URL:
`http://localhost:5173`

## 5. Build Commands

Backend:
```bash
cd smaart-emr-backend
npm run start
```

Frontend:
```bash
cd smaart-emr-frontend
npm run build
npm run preview
```

## 6. Common Troubleshooting

- `EADDRINUSE :5000`:
  stop existing process on port 5000, then restart backend.
- Login fails:
  verify seeded/admin credentials and JWT secret consistency.
- 404 API errors:
  confirm frontend `VITE_API_URL` and backend route mounting under `/api`.

## 7. Push To GitHub

From repo root:

```bash
git add .
git commit -m "feat: update backend and frontend"
git push -u origin <branch-name>
```

If remote needs to be changed:
```bash
git remote set-url origin https://github.com/<username>/<repo>.git
```

## 8. API Sharing For React Native Expo

Use one backend for both web and mobile. Share:
- Base URL: `https://your-domain/api`
- Auth flow: `POST /auth/login`
- JWT header: `Authorization: Bearer <token>`
- Route list by role (Admin/Nurse/Physio/Patient)
