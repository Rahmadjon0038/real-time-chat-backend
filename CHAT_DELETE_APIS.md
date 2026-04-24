# 🗑️ Chat’da delete qilish API’lari (chat hide + message delete)

Bu backend’da “delete” 2 xil ma’noda ishlatiladi:
1) **Chatni ro‘yxatdan o‘chirish (hide)** — faqat sizning chatlar ro‘yxatingizdan yo‘qoladi (boshqa participantda qoladi)
2) **Message delete** — chat ichidagi bitta xabarni o‘chirish

> Eslatma: “Hide” chatni DB’dan o‘chirib tashlamaydi. Yangi xabar kelsa chat avtomatik qaytib chiqadi.

Message delete qoidasi: **faqat xabar yuborgan user (sender)** o‘chira oladi va xabar DB’dan **butunlay o‘chadi**.

---

## 1) REST API: chatni ro‘yxatdan o‘chirish (hide)

### Endpoint
`DELETE /api/chats/:chatId`

### Headers
`Authorization: Bearer <JWT_TOKEN>`

### Misol (curl)
```bash
curl -s -X DELETE http://localhost:4444/api/chats/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Success response (200)
```json
{
  "success": true,
  "message": "Chat ro'yxatdan o'chirildi",
  "data": {
    "chatId": 1,
    "hidden": true
  }
}
```

---

## 2) REST API: message delete

### Endpoint
`DELETE /api/chats/:chatId/messages/:messageId`

### Headers
`Authorization: Bearer <JWT_TOKEN>`

### Misol (curl)
```bash
curl -s -X DELETE http://localhost:4444/api/chats/1/messages/10 \
  -H "Authorization: Bearer $TOKEN"
```

### Success response (200)
```json
{
  "success": true,
  "message": "Xabar o'chirildi",
  "data": {
    "messageId": 10,
    "chatId": 1,
    "deleted": true
  }
}
```

### Xatoliklar (asosiy)
- `401` — token yo‘q/noto‘g‘ri
- `403` — bu chatga kirish huquqi yo‘q **yoki** xabar sizniki emas
- `404` — xabar topilmadi
- `400` — `messageId` berilgan `chatId` ga tegishli emas

---

## 3) Socket.IO: message delete (real-time)

### Ulanish (JWT token bilan)
Client socket ulanishda token `auth.token` ko‘rinishida yuboriladi:
```js
const socket = io("http://localhost:4444", {
  auth: { token: "YOUR_JWT_TOKEN" }
});
```

### Client -> Server event
`delete_message`

#### Payload
```ts
{
  chatId: number;
  messageId: number;
}
```

#### Misol
```js
socket.emit("delete_message", { chatId: 1, messageId: 10 });
```

### Server -> Client event (broadcast)
Agar o‘chirish muvaffaqiyatli bo‘lsa, chat ichidagi hamma user’ga:
`message_deleted`

#### Payload
```ts
{
  success: true,
  data: {
    chatId: number,
    messageId: number
  }
}
```

#### Misol
```js
socket.on("message_deleted", (payload) => {
  console.log("deleted:", payload.data);
});
```

### Xatolik
Muvaffaqiyatsiz bo‘lsa server `error` event qaytaradi:
```js
socket.on("error", (payload) => console.log(payload));
```
