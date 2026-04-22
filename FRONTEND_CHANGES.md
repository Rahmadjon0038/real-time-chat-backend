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

## 2) Chat ochish: endi username emas, phone number

Oldin foydalanuvchini topish `username` orqali edi. Endi chat ochish **telefon raqami** orqali bo‘ladi.

### REST: `POST /api/chats/create`

Oldin:
```json
{ "targetUsername": "jane_doe" }
```

Endi:
```json
{ "targetPhone": "+998901234567" }
```

### Socket.IO: `create_chat`

Oldin:
```js
socket.emit('create_chat', { targetUsername: 'jane_doe' });
```

Endi:
```js
socket.emit('create_chat', { targetPhone: '+998901234567' });
```

## 3) Qo‘shimcha qaytadigan maydonlar (frontend uchun qulaylik)

### Message (REST va Socket `new_message`)
- `sender_phone` qo‘shildi
- `sent_at_uz` qo‘shildi

### Chat (REST va Socket `chat_created` / `new_chat`)
- `participant_phones` qo‘shildi (`GROUP_CONCAT`, vergul bilan ajratilgan string)
- `created_at_uz` qo‘shildi
- `last_message_time_uz` qo‘shildi (faqat chat listda)

### Typing event (`user_typing`)
- `phone` qo‘shildi

## 4) Telefon raqamini yuborish qoidasi (normalizatsiya)

Backend telefon raqamni minimal normalizatsiya qiladi:
- bo‘sh joy, `-`, `(`, `)` kabi belgilar olib tashlanadi
- Uzbekistan uchun qulaylik:
  - `901234567` → `+998901234567`
  - `998901234567` → `+998901234567`
  - `+998901234567` → `+998901234567`

Frontend tavsiya:
- Backendga `targetPhone` va `register.phone` ni iloji boricha `+998...` formatda yuboring.

## 5) Muhim: `phone` unique

Backend endi `users.phone` uchun unique index yaratadi. Shuning uchun:
- Register paytida bir xil telefon bilan qayta ro‘yxatdan o‘tish 400 qaytaradi: `Bu telefon raqami allaqachon mavjud`.
- Agar DB’da avvaldan duplicate telefonlar bo‘lsa, `create_chat` / `register` 409 qaytarishi mumkin: `Bu telefon raqami bir nechta foydalanuvchida bor (DB xatosi)`.

## 6) Backend sozlamasi (ixtiyoriy)

`.env` ga qo‘shsa bo‘ladi:
```env
APP_TIMEZONE=Asia/Tashkent
```

Default: `Asia/Tashkent`.
