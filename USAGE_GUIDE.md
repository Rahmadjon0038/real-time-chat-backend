# 🧭 Backend’ni ishlatish bo‘yicha qo‘llanma (REST + Socket.IO)

Bu hujjat `real-time-chat-backend` API’larini ishlatish bo‘yicha amaliy (step-by-step) qo‘llanma.

Qo‘shimcha hujjatlar:
- REST API tafsilotlari: `API_DOCUMENTATION.md`
- Socket eventlar: `SOCKET_DOCS.md`
- Swagger UI: `GET /api-docs` (masalan: `http://localhost:4444/api-docs`)

---

## 1) Ishga tushirish

### 1.1) Muhit o‘zgaruvchilari

`.env` namunasi:

```env
DB_PATH=./chat.db
APP_TIMEZONE=Asia/Tashkent
JWT_SECRET=your-very-secure-secret-key
PORT=4444
NODE_ENV=development
```

### 1.2) Backend’ni ishga tushirish

```bash
npm install
npm run dev
``
Server default: `http://localhost:4444`

Health check:
```bash
curl -s http://localhost:4444 | jq
```

---

## 2) Autentifikatsiya (JWT) oqimi

Bu backend’da deyarli barcha chat endpointlar **Bearer JWT** talab qiladi.

### 2.1) Register

```bash
curl -s -X POST http://localhost:4444/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+998901234567",
    "password": "securePassword123"
  }' | jq
```

### 2.2) Login va token olish

```bash
curl -s -X POST http://localhost:4444/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "password": "securePassword123"
  }' | jq
```

Javobdagi `data.token` qiymatini olib, keyingi so‘rovlarda ishlatasiz:

```bash
export TOKEN="PASTE_YOUR_JWT_HERE"
```

### 2.3) Profile (token tekshirish)

```bash
curl -s http://localhost:4444/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 3) REST API (HTTP) bilan ishlash

> Eslatma: `/api/chats/*` endpointlarida `Authorization: Bearer <token>` majburiy.

### 3.1) Barcha user’lar (chat ochish uchun)

```bash
curl -s http://localhost:4444/api/auth/users \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 3.2) Chat yaratish yoki mavjudini topish

```bash
curl -s -X POST http://localhost:4444/api/chats/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "targetPhone": "+998902345678" }' | jq
```

Javobdan `data.chat.id` ni olib qo‘ying:

```bash
export CHAT_ID="1"
```

### 3.3) User chatlari ro‘yxati

```bash
curl -s http://localhost:4444/api/chats \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 3.4) Chat detail

```bash
curl -s http://localhost:4444/api/chats/$CHAT_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 3.5) Chat message’larini olish (pagination)

`limit` va `offset` bilan:

```bash
curl -s "http://localhost:4444/api/chats/$CHAT_ID/messages?limit=50&offset=0" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 3.6) Message yuborish (REST)

```bash
curl -s -X POST http://localhost:4444/api/chats/$CHAT_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "content": "Salom!" }' | jq
```

Javobdan `data.message.id` ni olib qo‘ying:

```bash
export MESSAGE_ID="10"
```

### 3.7) Message delete (REST)

> Faqat **xabar yuborgan user** o‘chira oladi. O‘chirish DB’dan to‘liq o‘chirish (`DELETE`) ko‘rinishida.

```bash
curl -s -X DELETE http://localhost:4444/api/chats/$CHAT_ID/messages/$MESSAGE_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

Kutiladigan holatlar:
- `404` — xabar topilmadi
- `403` — bu xabar sizniki emas (Unauthorized)
- `400` — message `chatId` ga tegishli emas

---

## 4) Socket.IO (real-time) bilan ishlash

Socket ulanishda JWT token `auth.token` bilan yuboriladi.

### 4.1) Minimal client (Node/Frontend)

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:4444", {
  auth: { token: process.env.TOKEN }
});

socket.on("connect", () => console.log("connected", socket.id));
socket.on("error", (payload) => console.log("error", payload));

socket.on("new_message", (payload) => {
  console.log("new_message:", payload?.data?.message);
});

socket.on("message_deleted", (payload) => {
  console.log("message_deleted:", payload?.data);
});
```

### 4.2) Chatlarga ulanish

1) User’ning barcha chat room’lariga join:

```js
socket.emit("join_chats");
socket.on("joined_chats", (payload) => console.log(payload));
```

2) Bitta chatga join:

```js
socket.emit("join_chat", { chatId: 1 });
socket.on("joined_chat", (payload) => console.log(payload));
```

### 4.3) Message yuborish (Socket)

```js
socket.emit("send_message", { chatId: 1, content: "Salom, real-time!" });
```

Chat ichidagi hamma (o‘zingiz ham) `new_message` event oladi.

### 4.4) Message delete (Socket)

> Faqat **sender** o‘chira oladi. Muvaffaqiyat bo‘lsa chat ichidagi hamma `message_deleted` oladi.

```js
socket.emit("delete_message", { chatId: 1, messageId: 10 });
```

### 4.5) Chat yaratish (Socket)

```js
socket.emit("create_chat", { targetPhone: "+998902345678" });

socket.on("chat_created", (payload) => console.log("chat_created:", payload?.data?.chat));
socket.on("new_chat", (payload) => console.log("new_chat:", payload?.data?.chat)); // target user online bo‘lsa
```

### 4.6) Typing indikator

```js
socket.emit("typing", { chatId: 1, isTyping: true });
socket.emit("typing", { chatId: 1, isTyping: false });

socket.on("user_typing", (payload) => console.log("user_typing:", payload));
```

---

## 5) Tez-tez uchraydigan muammolar

### Token xatosi
- REST’da: `401` yoki `403`
- Socket’da: connect vaqtida `Authentication error` bo‘lishi mumkin

### “Bu chatga kirish huquqingiz yo‘q”
User chat participant bo‘lmasa, `/api/chats/:chatId/*` va socket `join_chat/send_message/delete_message` bloklanadi.

### Message delete ishlamayapti
- `messageId` noto‘g‘ri bo‘lishi mumkin (`404`)
- xabar sizniki emas (`403`)
- xabar boshqa chatga tegishli (`400`)

