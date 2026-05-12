# UCH Backend

![Node](https://img.shields.io/badge/node-20.x-green)
![Express](https://img.shields.io/badge/framework-express-black)
![License](https://img.shields.io/badge/license-TESL%20v2.0-blue)

Backend API for the Unity Care Hospital digital healthcare platform.

This service powers:

• Patient management  
• Appointment scheduling  
• Hospital bed allocation  
• Telemedicine session orchestration  
• Compliance audit logging  

The backend is designed for secure deployment in healthcare environments including:

• Cloud infrastructure  
• Private hospital networks  
• Air-gapped national healthcare systems

---

## Architecture

The backend follows a modular service architecture.

```

src/
controllers/
routes/
services/
models/
middlewares/
utils/
config/
server.js

```

Responsibilities:

| Layer | Responsibility |
|------|---------------|
| Routes | API endpoints |
| Controllers | Request handling |
| Services | Business logic |
| Models | Database interaction |
| Middleware | Auth / validation |
| Utils | Shared helpers |

---

## Technology Stack

| Component | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | PostgreSQL / MongoDB |
| Auth | JWT |
| Testing | Jest |
| Containerization | Docker |

---

## API Modules

| Module | Description |
|---|---|
| Patients | Patient registry |
| Appointments | Scheduling |
| Beds | Bed allocation |
| Telemedicine | Consultation sessions |
| Audit | Compliance logs |

---

## Local Development

Clone:

```

git clone [https://github.com/Elmahrosa/UCH-Backend](https://github.com/Elmahrosa/UCH-Backend)

```

Install dependencies:

```

npm install

```

Run dev server:

```

npm run dev

```

---

## Environment Variables

Create `.env`

Example:

```

PORT=3000
DATABASE_URL=postgres://localhost/uch
JWT_SECRET=replace_this

```

---

## Docker Deployment

Build container:

```

docker build -t uch-backend .

```

Run container:

```

docker run -p 3000:3000 uch-backend

```

---

## Security

Security controls include:

• JWT authentication  
• Request validation  
• Environment variable protection  
• Audit logging  

See:

```

docs/SECURITY.md

```

---

## Platform

Unity Care Hospital is part of the Elmahrosa digital infrastructure stack.

Institutional overview:

https://uch.teosegypt.com
```
