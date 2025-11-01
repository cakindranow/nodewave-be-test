# Product Excel Background Processing System

This repository implements a background processing system to handle **large Excel file uploads** efficiently without causing server timeout. Processing is done asynchronously using a message broker.

---

## 🚀 Tech Stack

| Component      | Technology       | Description                                       |
| -------------- | ---------------- | ------------------------------------------------- |
| Language       | TypeScript       | Main backend language                             |
| Framework      | Express          | HTTP REST API Framework                           |
| Database       | **PostgreSQL**   | Stores job status, file metadata, processing logs |
| ORM            | Prisma           | Database schema and query management              |
| Message Broker | **RabbitMQ**     | Job queue, message routing to background worker   |
| Logging        | Winston + Morgan | Application and request logging                   |

> Ensure the following versions or later are installed:
>
> * Node.js >= 16.14.2
> * PostgreSQL >= 14
> * RabbitMQ server running locally or via Docker

---

## 📦 System Overview

This system supports processing large Excel files without blocking API request threads. The main idea:

1. Client uploads Excel file
2. API saves file & creates job record in DB (`IN_PROGRESS`)
3. API publishes job message to RabbitMQ
4. API immediately returns success response
5. Background worker consumes message & processes file
6. Worker updates job status to `DONE` or `FAILED`
7. Client checks job status via API

---

## 🧠 System Flow Diagram

```
Client
  ↓
POST /upload
  ↓
Store file → Create job record → Publish job → Return success
  ↓
 RabbitMQ Queue
  ↓
 Worker reads job → Parses Excel → Updates DB
  ↓
Client polls GET /file-uploads/:id
```

---

## 🗃️ Database Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  fullName  String
  email     String   @unique
  password  String
  role      Roles    @default(USER)
}

enum Roles {
  ADMIN
  USER
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Int
  stock       Int     @default(0)
  createdAt   Int
}

model UploadFile {
  id            Int       @id @default(autoincrement())
  requestID     String    @unique
  status        FileStatus @default(IN_PROGRESS)
  totalRows     Int
  processedRows Int        @default(0)
  createdAt     Int
  updatedAt     Int
  error         String?
}

enum FileStatus {
  IN_PROGRESS
  DONE
  FAILED
}
```

---

## 🛠️ How to Run Locally

### 1. Clone repo

```bash
git clone <repo-url>
cd project-folder
git checkout develop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup `.env`

```
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
RABBITMQ_URL="amqp://localhost"
```

### 4. Run migrations

```bash
npx prisma migrate --name init
```

### 5. Start services

#### Start API

```bash
npm run dev -- --service=rest
```

#### Start Worker

```bash
npm run consumer
```

---

## 📂 Folder Structure Highlights

| Folder             | Description                                     |
| ------------------ | ----------------------------------------------- |
| `/app`             | App initializer by service type (REST / Worker) |
| `/server`          | Runtime server configs per service              |
| `/controllers`     | REST controllers                                |
| `/services`        | Business logic, job orchestrator                |
| `/server/rabbitmq` | RabbitMQ publisher & consumer                   |
| `/utils`           | Helpers (file handler, excel parser, logger)    |

---

## ✅ Job Lifecycle

| Status      | Meaning                     |
| ----------- | --------------------------- |
| IN_PROGRESS | Job queued or processing    |
| DONE        | File processed successfully |
| FAILED      | Processing failed           |

Worker retries automatically based on configured retry logic.

---

## 🧪 Testing

### 🔐 Login First

Before testing upload, authenticate first:

**POST /login**

```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

Save the returned token and use it in `Authorization: Bearer <token>` header.

### 📤 Upload File

```bash
curl --location 'http://localhost:3150/products/upload' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYxOTgwMjkwLCJleHAiOjE3NjIxNTMwOTB9.IJnR5hPmaq97-DvTJ6oLoOutmMYmA7LAAPG0A_0eNc4' \
--form 'file=@"/C:/Users/Ryzen XT/Downloads/products_sample.xlsx"'
```

### ✅ Check Job Status

```bash
curl --location --request GET 'http://localhost:3150/file-uploads/1beb75f4-c362-4040-a92f-d317c90c6673d' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYyMDEyMTAxLCJleHAiOjE3NjIxODQ5MDF9.ymNsh94EeQ66n9J6xkB3L_GZ2u6MHWcLyyEF93V2ZeU' \
--form 'file=@"/C:/Users/Ryzen XT/Downloads/products_sample.xlsx"'
```

---

## 📣 Notes

* This project uses an asynchronous background task model
* Ideal for high‑volume file processing systems
* Postman collection is available in the repository for testing all endpoints

---

## 📞 Contact Details
* Name: Agung Indrawan
* Email: agungindrawan017@gmail.com
* WhatsApp: +62 896-1285-4712

--- 
