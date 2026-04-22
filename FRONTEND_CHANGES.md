# Frontend uchun o‘zgarishlar (2026-04-22)

Bu fayl backend’da qilingan o‘zgarishlar bo‘yicha frontendchi uchun “nima o‘zgardi / nimani moslash kerak” qo‘llanmasi.

## 1) Xabar va vaqt (Uzbekistan vaqti)

Backend SQLite `CURRENT_TIMESTAMP` ni UTC’da saqlaydi (`sent_at`, `last_message_time`, `created_at`). Frontendda vaqt “siljib” ko‘rinmasligi uchun backend endi qo‘shimcha `*_uz` maydonlarini qaytaradi:

- `messages[].sent_at_uz` — `Asia/Tashkent` bo‘yicha `YYYY-MM-DD HH:mm:ss`
- `chats[].last_message_time_uz` — `Asia/Tashkent` bo‘yicha `YYYY-MM-DD HH:mm:ss`
- `chat.created_at_uz` / `chats[].created_at_uz` — `Asia/Tashkent` bo‘yicha `YYYY-MM-DD HH:mm:ss`

Frontend tavsiya:
- UI’da vaqt ko‘rsatishda `sent_at_uz` va `last_message_time_uz` dan foydalaning (oddiy string sifatida chiqarish mumkin).
- Eski `sent_at` va `last_message_time` maydonlari ham qoladi (UTC).

## 2) Auth: endi username yo‘q (phone-based login)

Backendda `username` butunlay olib tashlandi.

### Register: `POST /api/auth/register`
Yuboriladi:
```json
{ "name": "John Doe", "phone": "+998901234567", "password": "parol123" }
```

Response `data.user`: `{ id, name, phone }` (username yo‘q).

### Login: `POST /api/auth/login`
Yuboriladi:
```json
{ "phone": "+998901234567", "password": "parol123" }
```

Response `data.user`: `{ id, name, phone }` + `token`.

## 3) Chat ochish: phone number orqali

### REST: `POST /api/chats/create`
```json
{ "targetPhone": "+998901234567" }
```

### Socket.IO: `create_chat`
```js
socket.emit('create_chat', { targetPhone: '+998901234567' });
```

## 4) Payload o‘zgarishlari (username olib tashlandi + yangi fieldlar)

### Message (REST va Socket `new_message`)
- `sender_phone` qo‘shildi
- `sent_at_uz` qo‘shildi
- `sender_username` endi yo‘q (faqat `sender_name`, `sender_phone`)

### Chat (REST va Socket `chat_created` / `new_chat`)
- `participant_phones` qo‘shildi (`GROUP_CONCAT`, vergul bilan ajratilgan string)
- `created_at_uz` qo‘shildi
- `last_message_time_uz` qo‘shildi (faqat chat listda)
- `participant_usernames` endi yo‘q (faqat `participant_names`, `participant_phones`)

### Typing event (`user_typing`)
- `phone` qo‘shildi
- `username` o‘rniga `name` ishlatiladi (`{ userId, name, phone, isTyping }`)

## 5) Xabar o‘chirish (delete)

### REST
- `DELETE /api/chats/{chatId}/messages/{messageId}`

### Socket.IO
- emit: `delete_message` → `{ chatId, messageId }`
- receive: `message_deleted` → `{ chatId, messageId }`

Eslatma: faqat xabar yuborgan user o‘chira oladi.

## 6) Telefon raqamini yuborish qoidasi (normalizatsiya)

Backend telefon raqamni minimal normalizatsiya qiladi:
- bo‘sh joy, `-`, `(`, `)` kabi belgilar olib tashlanadi
- Uzbekistan uchun qulaylik:
  - `901234567` → `+998901234567`
  - `998901234567` → `+998901234567`
  - `+998901234567` → `+998901234567`

Frontend tavsiya:
- Backendga `targetPhone` va `register.phone` ni iloji boricha `+998...` formatda yuboring.

## 7) Muhim: `phone` unique

Backend endi `users.phone` uchun unique index yaratadi. Shuning uchun:
- Register paytida bir xil telefon bilan qayta ro‘yxatdan o‘tish 400 qaytaradi: `Bu telefon raqami allaqachon mavjud`.
- Agar DB’da avvaldan duplicate telefonlar bo‘lsa, `create_chat` / `register` 409 qaytarishi mumkin: `Bu telefon raqami bir nechta foydalanuvchida bor (DB xatosi)`.

## 8) Backend sozlamasi (ixtiyoriy)

`.env` ga qo‘shsa bo‘ladi:
```env
APP_TIMEZONE=Asia/Tashkent
```

Default: `Asia/Tashkent`.
