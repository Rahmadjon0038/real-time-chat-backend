# Yangi endpointlar (Read/Unread + Profil tahriri)

Ushbu fayl 2026-04-26 dagi backend o‘zgarishlari bo‘yicha **yangi qo‘shilgan endpointlar** va **response yangilanishlarini** qisqacha tushuntiradi.

## 1) Profilni tahrirlash (ism + profil rasm)

### `PUT /api/auth/profile`
Token: `Authorization: Bearer <JWT>`

Body (JSON):
```json
{
  "name": "Yangi Ism",
  "profile_image_base64": "data:image/png;base64,iVBORw0KGgoAAA...",
  "profile_image_remove": false
}
```

Eslatma:
- `profile_image_base64` faqat **data URL** formatda: `image/png`, `image/jpeg`, `image/webp`
- Maksimum hajm: **5MB**
- `profile_image_remove: true` yuborilsa, profil rasm o‘chiriladi

Response:
- `data.user.profile_image` — serverda saqlangan path, masalan: `/uploads/avatars/user_1_...png`
- `data.user.profile_image_url` — to‘liq URL (frontend uchun qulay)

Server static:
- `GET /uploads/...` orqali rasmlar beriladi

## 2) Chatda o‘qildi / o‘qilmadi (read receipts)

### `POST /api/chats/:chatId/read`
Token: `Authorization: Bearer <JWT>`

Body (JSON) ixtiyoriy:
```json
{ "messageId": 123 }
```

Qoidalar:
- `messageId` berilsa: shu xabargacha (inclusive) **o‘qildi** deb belgilanadi
- `messageId` berilmasa: chatdagi **oxirgi xabar**gacha o‘qildi deb belgilanadi

Socket broadcast:
- REST orqali chaqirilsa ham server `chat_read` event’ini chat room’ga yuboradi (agar Socket.IO ulangan bo‘lsa).

## 3) Mavjud endpoint response yangilanishlari

### `GET /api/chats`
Endi chat obyektida qo‘shimcha maydonlar qaytadi:
- `unread_count` — joriy foydalanuvchi uchun o‘qilmagan xabarlar soni
- `my_last_read_message_id` — oxirgi o‘qilgan message ID
- `my_last_read_at` — oxirgi o‘qish vaqti
- `participant_profile_images` — ishtirokchilar profil rasmlari (vergul bilan `GROUP_CONCAT`)

### `GET /api/chats/:chatId/messages`
Endi response’da qo‘shimcha qaytadi:
- `readState` — participantlar bo‘yicha `last_read_message_id` / `last_read_at`
- `myLastReadMessageId`, `myLastReadAt`

Frontend hisoblash (oddiy):
- Xabar o‘qilgan deb hisoblash: `readState` ichidagi kerakli user’ning `last_read_message_id >= message.id`

## 4) Socket.IO (read receipts)

### Client → Server: `mark_read`
Payload:
```json
{ "chatId": 10, "messageId": 123 }
```
`messageId` bo‘lmasa server chatdagi oxirgi xabarni oladi.

### Server → Client: `marked_read`
O‘zi yuborgan user’ga tasdiq:
```json
{
  "success": true,
  "data": { "chatId": 10, "userId": 1, "messageId": 123, "readAt": "2026-04-26T..." }
}
```

### Server → Chat room: `chat_read`
Boshqa participantlarga real-time read update:
```json
{
  "success": true,
  "data": { "chatId": 10, "userId": 1, "messageId": 123, "readAt": "2026-04-26T..." }
}
```

