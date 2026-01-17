# Markaziy Agrobank Chiquvchi Xatlarni Ro'yxatga Olish Tizimi

Ushbu loyiha Markaziy Agrobank uchun chiquvchi xatlarni boshqarish va ularni tartib bilan ro'yxatga olish uchun mo'ljallangan enterprise darajasidagi platformadir.

## 1. Loyiha haqida
Loyiha chiquvchi xatlarni raqamlash, ularni arxivlash va boshqarish jarayonini avtomatlashtiradi. Tizim ikkita asosiy qismdan iborat:
*   **Foydalanuvchi Portali**: Ijrochilar uchun xatlar yaratish va ro'yxatga olish.
*   **Admin Panel**: Administratorlar uchun foydalanuvchilar, indekslar, bo'limlar va hisobotlarni boshqarish.

## 2. Ishlash printsipi
Tizim mijoz-server (client-server) arxitekturasida ishlaydi:
1.  Ijrochi xat ma'lumotlarini (mavzu, qabul qiluvchi, indeks va fayllar) kiritadi.
2.  Xat "Qoralama" (Draft) yoki "Ro'yxatga olingan" (Registered) holatida saqlanishi mumkin.
3.  Ro'yxatga olingan xatga tizim tomonidan avtomatik ravishda noyob raqam (Indeks/Ketma-ketlik) beriladi.
4.  Admin panel orqali barcha jarayonlar nazorat qilinadi va hisobotlar Excel formatida eksport qilinadi.

## 3. Serverga to'g'ri joylashtirish (Deployment)
Serverga joylashtirish uchun quyidagi qadamlar tavsiya etiladi:

### Frontend build:
```bash
npm install
npm run build
```
`dist` papkasidagi fayllarni Nginx yoki Apache orqali xizmat qildiring.

### Backend build:
1.  Server (Node.js) muhitida:
    ```bash
    cd server
    npm install
    npm run build
    ```
2.  **PM2** orqali ishga tushirish (tavsiya etiladi):
    ```bash
    pm2 start dist/server.js --name agrobank-backend
    ```

## 4. Tizim talablari
*   **Node.js**: v18.0.0 yoki undan yuqori.
*   **npm**: v9.0.0 yoki undan yuqori.
*   **Ma'lumotlar bazasi**: SQLite (default) yoki PostgreSQL (Prisma orqali sozlanishi mumkin).
*   **Operatsion tizim**: Linux (Ubuntu tavsiya etiladi), Windows Server yoki macOS.

## 5. Muhit drayverlarini sozlash (.env)
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
1.  **`PORT`**: Backend server ishlaydigan port (standart: 5000).
2.  **`DATABASE_URL`**: Ma'lumotlar bazasiga ulanish manzili.
3.  **`JWT_SECRET`**: Seanslarni himoyalash uchun maxfiy kalit.
4.  **`ADMIN_USERNAME` va `ADMIN_PASSWORD`**: Tizim birinchi marta ishga tushirilganda (`npm run seed`) yaratiladigan asosiy administrator ma'lumotlari.
5.  **`USER_USERNAME` va `USER_PASSWORD`**: Sinov (test) uchun yaratiladigan oddiy foydalanuvchi ma'lumotlari.
6.  **`SEED_ALLOW_ADMIN_RESET`**: Agar `true` bo'lsa, har safar `seed` buyrug'i berilganda admin paroli `.env` dagi qiymatga qaytariladi. `false` bo'lsa, o'zgartirilgan parol saqlanib qoladi.
7.  **`NODE_ENV`**: Tizim qaysi rejimda ishlayotganini bildiradi (`development` yoki `production`). Production muhitida xavfsizlik cheklovlari kuchayadi.

## 6. Ishga tushirish (Qadamlar ketma-ketligi)
Loyiha mahalliy kompyuterda ishga tushirish tartibi:

1.  **Backendni sozlash**:
    ```bash
    cd server
    npm install
    npx prisma migrate dev --name init
    npm run seed
    npm run dev
    ```
2.  **Frontendni ishga tushirish**:
    ```bash
    cd ..
    npm install
    npm run dev
    ```

## 7. Texnologiyalar stacki
### Frontend:
*   React 18, TypeScript, Vite
*   Tailwind CSS (Stillashtirish)
*   Shadcn UI (Komponentlar kutubxonasi)
*   Lucide React (Ikonkalar)
*   Sonner (Bildirishnomalar)

### Backend:
*   Node.js, Express, TypeScript
*   Prisma ORM (Ma'lumotlar bazasi bilan ishlash)
*   JWT & Bcrypt (Xavfsizlik va Autentifikatsiya)
*   Multer (Fayllarni yuklash)

## 8. Imkoniyatlar (Features)
*   **Xatlarni ro'yxatga olish**: Avtomatik raqamlash tizimi (Indeks/Yil/Tartib raqami).
*   **Sana cheklovlari**: Kelajak sanasiga xat yozishni bloklash va o'tmish sanalarni admin ruxsati bilan boshqarish.
*   **Qidiruv tizimi**: Xat raqami, mavzu, ijrochi va indeks bo'yicha kuchli qidiruv.
*   **Hisobotlar**: Ma'lumotlarni Excel (XLSX) va CSV formatlarida eksport qilish.
*   **Fayllar bilan ishlash**: Asosiy xat fayli va cheksiz ilovalarni yuklash/yuklab olish.
*   **Admin Boshqaruvi**: Foydalanuvchilar, bo'limlar va indekslarni to'liq CRUD qilish.
*   **Xavfsizlik**: Foydalanuvchi holatini (active/disabled) tekshirish va maxfiy adminlarni ro'yxatdan yashirish.
*   **Navigatsiya himoyasi**: Saqlanmagan xat ma'lumotlarini yo'qotib qo'ymaslik uchun ogohlantirish tizimi.
*   **Dark Mode**: To'liq qorong'u rejim qo'llab-quvvatlanadi.

## 9. Mualliflik huquqi va egalik
Ushbu tizim Markaziy Agrobankning ichki foydalanishi uchun ishlab chiqilgan. Barcha huquqlar saqlangan. Tizim kodi va ma'lumotlarini ruxsatsiz tarqatish yoki nusxalash taqiqlanadi.

---
© 2026 Markaziy Agrobank. Ichki operatsiyalar boshqarmasi.