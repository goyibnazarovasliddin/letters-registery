# Elektron Jurnal — Markaziy Agrobank

<div align="center">

**Chiquvchi xatlarni ro'yxatga olish tizimi**  
*Outgoing Letters Registration System*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat)](LICENSE)

</div>

---

## Mundarija / Table of Contents

- [O'zbek tilida](#uzbek-version)
  - [Loyiha haqida](#1-loyiha-haqida)
  - [Ishlash printsipi](#2-ishlash-printsipi)
  - [Deployment](#3-deployment)
  - [Tizim talablari](#4-tizim-talablari)
  - [Muhit o'zgaruvchilari](#5-muhit-ozgaruvchilarini-sozlash-env)
  - [Ishga tushirish](#6-ishga-tushirish-qadamlar-ketma-ketligi)
  - [Texnologiyalar](#7-texnologiyalar-stacki)
  - [Imkoniyatlar](#8-imkoniyatlar-features)
- [English Version](#english-version)
  - [About the Project](#about-the-project)
  - [How It Works](#how-it-works)
  - [Deployment](#deployment)
  - [System Requirements](#system-requirements)
  - [Environment Variables](#environment-variables)
  - [Getting Started](#getting-started)
  - [Technology Stack](#technology-stack)
  - [Features](#features)

---

<a name="uzbek-version"></a>
# 🇺🇿 O'zbek tilida

## 1. Loyiha haqida

Ushbu loyiha **Markaziy Agrobank** uchun chiquvchi xatlarni boshqarish va ularni tartib bilan ro'yxatga olish uchun mo'ljallangan enterprise darajasidagi platformadir.

Tizim chiquvchi xatlarni raqamlash, ularni arxivlash va boshqarish jarayonini avtomatlashtiradi. Tizim ikkita asosiy qismdan iborat:

- **Foydalanuvchi Portali**: Ijrochilar uchun xatlar yaratish va ro'yxatga olish.
- **Admin Panel**: Administratorlar uchun foydalanuvchilar, indekslar, bo'limlar va hisobotlarni boshqarish.

## 2. Ishlash printsipi

Tizim mijoz-server (client-server) arxitekturasida ishlaydi:

1. Ijrochi xat ma'lumotlarini (mavzu, qabul qiluvchi, indeks va fayllar) kiritadi.
2. Xat **"Qoralama"** (Draft) yoki **"Ro'yxatga olingan"** (Registered) holatida saqlanishi mumkin.
3. Ro'yxatga olingan xatga tizim tomonidan avtomatik ravishda noyob raqam (Indeks/Ketma-ketlik) beriladi.
4. Admin panel orqali barcha jarayonlar nazorat qilinadi va hisobotlar Excel formatida eksport qilinadi.

## 3. Deployment

Tizimni serverga joylashtirishning ikkita usuli mavjud:

### A. Docker orqali (Tavsiya etiladi)

Bu usul eng oson va tezkor usuldir. Sizga faqat Docker va Docker Compose o'rnatilgan bo'lishi kifoya.

1. Loyiha ildiz papkasida buyruqni ishga tushiring:
   ```bash
   docker compose up -d --build
   ```

2. Tizim avtomatik ravishda:
   - Backendni quradi va 5000-portda ishga tushiradi.
   - Ma'lumotlar bazasi migratsiyasini bajaradi.
   - Frontendni quradi va uni Nginx orqali 8080-portda taqdim etadi.

3. Kirish manzillari:
   - **Frontend**: `http://localhost:8080`
   - **Backend API**: `http://localhost:5000`

4. Container nomlarini tekshirish:
   ```bash
   docker ps
   ```
   Natijada `elektron-jurnal-backend` va `elektron-jurnal-frontend` containerlarini ko'rishingiz kerak.

### B. Qo'lda joylashtirish (Manual Deployment)

Agar Docker ishlatish imkoni bo'lmasa:

#### Frontend build:
1. `npm install`
2. `npm run build`
3. `dist` papkasidagi fayllarni Nginx yoki Apache orqali xizmat qildiring.

#### Backend build:
1. `cd server`
2. `npm install`
3. `npm run build`
4. **PM2** orqali ishga tushirish (tavsiya etiladi):
   ```bash
   pm2 start dist/server.js --name elektron-jurnal-backend
   ```

## 4. Tizim talablari

- **Docker** va **Docker Compose** (A usul uchun)
- **Node.js**: v18.0.0 yoki undan yuqori (B usul uchun)
- **npm**: v9.0.0 yoki undan yuqori (B usul uchun)
- **Ma'lumotlar bazasi**: SQLite (default) yoki PostgreSQL (Prisma orqali sozlanishi mumkin)
- **Operatsion tizim**: Linux (Ubuntu tavsiya etiladi), Windows Server yoki macOS

## 5. Muhit o'zgaruvchilarini sozlash (.env)

Backend to'g'ri ishlashi uchun `server/` papkasida `.env` fayli bo'lishi shart. Ushbu faylda tizimning maxfiy sozlamalari saqlanadi.

### Namuna (`.env` fayli tarkibi):

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="sizning_juda_maxfiy_va_uzun_kalitingiz"

# Boshlang'ich (Seed) ma'lumotlar uchun login va parollar
ADMIN_USERNAME=ADMIN_USERNAME_VALUE
ADMIN_PASSWORD=ADMIN_PASSWORD_VALUE

USER_USERNAME=USER_USERNAME_VALUE
USER_PASSWORD=USER_PASSWORD_VALUE

# Qo'shimcha sozlamalar
SEED_ALLOW_ADMIN_RESET="false"
NODE_ENV="development"
```

### Parametrlar tavsifi:

| Parametr | Tavsif |
|----------|--------|
| `PORT` | Backend server ishlaydigan port (standart: 5000) |
| `DATABASE_URL` | Ma'lumotlar bazasiga ulanish manzili |
| `JWT_SECRET` | Seanslarni himoyalash uchun maxfiy kalit. **MUHIM**: Ishlab chiqarish muhitida kuchli, tasodifiy qiymat ishlatilishi shart! |
| `ADMIN_USERNAME` | Tizim birinchi marta ishga tushirilganda yaratiladigan asosiy administrator login nomi |
| `ADMIN_PASSWORD` | Administrator paroli |
| `USER_USERNAME` | Sinov (test) uchun yaratiladigan oddiy foydalanuvchi login nomi |
| `USER_PASSWORD` | Test foydalanuvchi paroli |
| `SEED_ALLOW_ADMIN_RESET` | Agar `true` bo'lsa, har safar `seed` buyrug'i berilganda admin paroli `.env` dagi qiymatga qaytariladi |
| `NODE_ENV` | Tizim rejimi: `development` yoki `production` |

> **Xavfsizlik eslatmasi**: `.env` fayli hech qachon Git repositoriyasiga yuklanmasligi kerak! U `.gitignore` faylida ro'yxatga olingan.

### JWT_SECRET yaratish:

Xavfsiz JWT_SECRET yaratish uchun quyidagi buyruqlardan birini ishlating:

```bash
# Node.js orqali
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL orqali
openssl rand -hex 64
```

## 6. Ishga tushirish (Qadamlar ketma-ketligi)

Loyiha mahalliy kompyuterda ishga tushirish tartibi:

### 1. Backendni sozlash:

```bash
cd server
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

### 2. Frontendni ishga tushirish:

```bash
cd ..
npm install
npm run dev
```

Frontend `http://localhost:5173` manzilida, Backend esa `http://localhost:5000` manzilida ishga tushadi.

## 7. Texnologiyalar stacki

### Frontend:
- **React 18** - UI kutubxonasi
- **TypeScript** - Statik tipizatsiya
- **Vite** - Build tool
- **Tailwind CSS v4** - Stillashtirish
- **Shadcn UI** - Komponentlar kutubxonasi
- **Lucide React** - Ikonkalar
- **React Router v7** - Marshrutlash
- **Axios** - HTTP so'rovlar
- **Sonner** - Bildirishnomalar
- **React Hook Form** - Forma boshqaruvi
- **date-fns** - Sana bilan ishlash

### Backend:
- **Node.js** - Runtime muhiti
- **Express** - Web framework
- **TypeScript** - Statik tipizatsiya
- **Prisma ORM** - Ma'lumotlar bazasi bilan ishlash
- **JWT & Bcrypt** - Xavfsizlik va Autentifikatsiya
- **Multer** - Fayllarni yuklash
- **Zod** - Ma'lumotlarni validatsiya qilish

### Ma'lumotlar bazasi:
- **SQLite** (default, development)
- **PostgreSQL** (production uchun tavsiya etiladi)

## 8. Imkoniyatlar (Features)

**Xatlarni ro'yxatga olish**: Avtomatik raqamlash tizimi (Indeks/Yil/Tartib raqami)  
**Sana cheklovlari**: Kelajak sanasiga xat yozishni bloklash va o'tmish sanalarni admin ruxsati bilan boshqarish  
**Qidiruv tizimi**: Xat raqami, mavzu, ijrochi va indeks bo'yicha kuchli qidiruv  
**Hisobotlar**: Ma'lumotlarni Excel (XLSX) va CSV formatlarida eksport qilish  
**Fayllar bilan ishlash**: Asosiy xat fayli va cheksiz ilovalarni yuklash/yuklab olish  
**Admin Boshqaruvi**: Foydalanuvchilar, bo'limlar va indekslarni to'liq CRUD qilish  
**Xavfsizlik**: Foydalanuvchi holatini (active/disabled) tekshirish va maxfiy adminlarni ro'yxatdan yashirish  
**Navigatsiya himoyasi**: Saqlanmagan xat ma'lumotlarini yo'qotib qo'ymaslik uchun ogohlantirish tizimi  
**Dark Mode**: To'liq qorong'u rejim qo'llab-quvvatlanadi  
**Responsive Design**: Mobil, planshet va desktop qurilmalarda to'liq moslashuvchan interfeys  
**Session Management**: 24 soatlik sessiya muddati bilan xavfsiz autentifikatsiya  

---

<a name="english-version"></a>
# 🇬🇧 English Version

## About the Project

This is an enterprise-grade platform designed for **Central Agrobank** to manage and systematically register outgoing letters.

The system automates the process of numbering, archiving, and managing outgoing correspondence. It consists of two main components:

- **User Portal**: For employees to create and register letters
- **Admin Panel**: For administrators to manage users, indices, departments, and reports

## How It Works

The system operates on a client-server architecture:

1. An employee enters letter details (subject, recipient, index, and files)
2. Letters can be saved as **"Draft"** or **"Registered"** status
3. Registered letters automatically receive a unique number (Index/Sequence)
4. All processes are monitored through the admin panel, and reports can be exported to Excel format

## Deployment

There are two ways to deploy the system:

### A. Using Docker (Recommended)

This is the easiest and fastest method. You only need Docker and Docker Compose installed.

1. Run the command in the project root directory:
   ```bash
   docker compose up -d --build
   ```

2. The system will automatically:
   - Build and start the backend on port 5000
   - Run database migrations
   - Build the frontend and serve it via Nginx on port 8080

3. Access points:
   - **Frontend**: `http://localhost:8080`
   - **Backend API**: `http://localhost:5000`

4. Verify container names:
   ```bash
   docker ps
   ```
   You should see `elektron-jurnal-backend` and `elektron-jurnal-frontend` containers.

### B. Manual Deployment

If Docker is not available:

#### Frontend build:
1. `npm install`
2. `npm run build`
3. Serve the files from the `dist` folder via Nginx or Apache

#### Backend build:
1. `cd server`
2. `npm install`
3. `npm run build`
4. Start with **PM2** (recommended):
   ```bash
   pm2 start dist/server.js --name elektron-jurnal-backend
   ```

## System Requirements

- **Docker** and **Docker Compose** (for method A)
- **Node.js**: v18.0.0 or higher (for method B)
- **npm**: v9.0.0 or higher (for method B)
- **Database**: SQLite (default) or PostgreSQL (configurable via Prisma)
- **Operating System**: Linux (Ubuntu recommended), Windows Server, or macOS

## Environment Variables

For the backend to work correctly, a `.env` file must exist in the `server/` directory. This file stores the system's confidential settings.

### Sample `.env` file:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_very_secret_and_long_key"

# Initial seed data credentials
ADMIN_USERNAME=ADMIN_USERNAME_VALUE
ADMIN_PASSWORD=ADMIN_PASSWORD_VALUE

USER_USERNAME=USER_USERNAME_VALUE
USER_PASSWORD=USER_PASSWORD_VALUE

# Additional settings
SEED_ALLOW_ADMIN_RESET="false"
NODE_ENV="development"
```

### Parameter Descriptions:

| Parameter | Description |
|-----------|-------------|
| `PORT` | Port on which the backend server runs (default: 5000) |
| `DATABASE_URL` | Database connection string |
| `JWT_SECRET` | Secret key for session protection. **IMPORTANT**: Use a strong, random value in production! |
| `ADMIN_USERNAME` | Administrator login created on first system initialization |
| `ADMIN_PASSWORD` | Administrator password |
| `USER_USERNAME` | Test user login |
| `USER_PASSWORD` | Test user password |
| `SEED_ALLOW_ADMIN_RESET` | If `true`, admin password resets to `.env` value on each `seed` command |
| `NODE_ENV` | System mode: `development` or `production` |

> **Security Note**: The `.env` file should NEVER be committed to the Git repository! It's listed in `.gitignore`.

### Generating JWT_SECRET:

To create a secure JWT_SECRET, run one of these commands:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

## Getting Started

To run the project locally:

### 1. Setup Backend:

```bash
cd server
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

### 2. Start Frontend:

```bash
cd ..
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, Backend at `http://localhost:5000`.

## Technology Stack

### Frontend:
- **React 18** - UI library
- **TypeScript** - Static typing
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **Shadcn UI** - Component library
- **Lucide React** - Icons
- **React Router v7** - Routing
- **Axios** - HTTP requests
- **Sonner** - Notifications
- **React Hook Form** - Form management
- **date-fns** - Date handling

### Backend:
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Static typing
- **Prisma ORM** - Database management
- **JWT & Bcrypt** - Security and Authentication
- **Multer** - File uploads
- **Zod** - Data validation

### Database:
- **SQLite** (default, development)
- **PostgreSQL** (recommended for production)

## Features

**Letter Registration**: Automatic numbering system (Index/Year/Sequence)  
**Date Restrictions**: Block future dates and manage past dates with admin permission  
**Search System**: Powerful search by letter number, subject, executor, and index  
**Reports**: Export data to Excel (XLSX) and CSV formats  
**File Management**: Upload/download main letter file and unlimited attachments  
**Admin Management**: Full CRUD operations for users, departments, and indices  
**Security**: User status checking (active/disabled) and hidden admin accounts  
**Navigation Guard**: Warning system to prevent loss of unsaved letter data  
**Dark Mode**: Full dark theme support  
**Responsive Design**: Fully adaptive interface for mobile, tablet, and desktop  
**Session Management**: Secure authentication with 24-hour session expiry  

---

## Screenshots

> **Note**: Add screenshots of your application here to showcase the UI

---

## Troubleshooting

### Common Issues:

**Issue**: Backend fails to start with "EADDRINUSE" error  
**Solution**: Another process is using port 5000. Either stop that process or change the `PORT` in `.env`

**Issue**: Database migration fails  
**Solution**: Delete `server/prisma/dev.db` and run `npx prisma migrate dev --name init` again

**Issue**: Frontend can't connect to backend  
**Solution**: Ensure backend is running and check the API URL in frontend configuration

**Issue**: Docker containers fail to start  
**Solution**: Run `docker compose down -v` to remove volumes, then `docker compose up -d --build`

---

## License

This system is developed for internal use by Central Agrobank. All rights reserved. Unauthorized distribution or copying of the system code and data is prohibited.

---

## Contributing

This is a proprietary internal system. For bug reports or feature requests, please contact the Internal Operations Department.

---

<div align="center">

**© 2026 Markaziy Agrobank. Ichki operatsiyalar boshqarmasi.**  
*© 2026 Central Agrobank. Internal Operations Department.*

</div>