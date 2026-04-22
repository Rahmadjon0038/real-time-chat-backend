# 📚 Backend API Qo'llanmasi

Bu erda backend'dagi barcha API endpoint'larning tafsilotiy dokumentatsiyasi, har bir API'ga nima yuborish kerak va nima qaytaradi.

---

## 🔐 **AUTH API'LARI**

### 1️⃣ **REGISTER - Yangi Foydalanuvchi Ro'yxatdan O'tkazish**
```
POST /api/auth/register
```
**Nima Yuborish Kerak:**
```json
{
  "name": "John Doe",
  "phone": "+998901234567",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "phone": "+998901234567"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2️⃣ **LOGIN - Tizimga Kirish**
```
POST /api/auth/login
```
**Nima Yuborish Kerak:**
```json
{
  "phone": "+998901234567",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli tizimga kirildi",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "phone": "+998901234567"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3️⃣ **GET PROFILE - Profil Ma'lumotlarini Olish**
```
GET /api/auth/profile
```
**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "phone": "+998901234567",
      "created_at": "2026-04-19 10:30:00"
    }
  }
}
```

---

### 4️⃣ **GET ALL USERS - Barcha Foydalanuvchilar**
```
GET /api/auth/users
```
**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 2,
        "name": "Alice Smith",
        "phone": "+998902345678"
      },
      {
        "id": 3,
        "name": "Bob Wilson",
        "phone": "+998903456789"
      }
    ]
  }
}
```

---

## 💬 **CHAT API'LARI**

### 5️⃣ **GET USER CHATS - Foydalanuvchining Chatlar Ro'yxati**
```
GET /api/chats
```
**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "id": 1,
        "name": null,
        "type": "private",
        "participant_phones": "+998901234567,+998902345678",
        "participant_names": "John Doe,Alice Smith",
        "last_message": "Salomu aleykum!",
        "last_message_time": "2026-04-19 15:45:30",
        "last_message_time_uz": "2026-04-19 20:45:30"
      },
      {
        "id": 2,
        "name": "Jamshid Group",
        "type": "group",
        "participant_phones": "+998901234567,+998903456789",
        "participant_names": "John Doe,Bob Wilson",
        "last_message": "Assalomualaikum hamisha",
        "last_message_time": "2026-04-19 14:20:10",
        "last_message_time_uz": "2026-04-19 19:20:10"
      }
    ]
  }
}
```

---

### 6️⃣ **CREATE CHAT - Yangi Chat Yaratish yoki Mavjudini Topish**
```
POST /api/chats/create
```
**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Nima Yuborish Kerak:**
```json
{
  "targetPhone": "+998902345678"
}
```

**Response (200 OK - Mavjud Chat):**
```json
{
  "success": true,
  "message": "Mavjud chat topildi",
  "data": {
    "chat": {
      "id": 1,
      "name": null,
      "type": "private",
      "participant_ids": "1,2",
      "participant_phones": "+998901234567,+998902345678",
      "participant_names": "John Doe,Alice Smith",
      "created_at": "2026-04-19 10:30:00",
      "created_at_uz": "2026-04-19 15:30:00"
    }
  }
}
```

**Response (201 Created - Yangi Chat):**
```json
{
  "success": true,
  "message": "Yangi chat yaratildi",
  "data": {
    "chat": {
      "id": 3,
      "name": null,
      "type": "private",
      "participant_ids": "1,4",
      "participant_phones": "+998901234567,+998909999999",
      "participant_names": "John Doe,New User",
      "created_at": "2026-04-19 10:35:00",
      "created_at_uz": "2026-04-19 15:35:00"
    }
  }
}
```

---

### 7️⃣ **GET CHAT DETAILS - Chat Ma'lumotlarini Olish**
```
GET /api/chats/{chatId}
```
**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Example:**
```
GET /api/chats/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "chat": {
      "id": 1,
      "name": null,
      "type": "private",
      "participant_ids": "1,2",
      "participant_phones": "+998901234567,+998902345678",
      "participant_names": "John Doe,Alice Smith",
      "created_at": "2026-04-19 10:30:00",
      "created_at_uz": "2026-04-19 15:30:00"
    }
  }
}
```

---

### 8️⃣ **GET CHAT MESSAGES - Chat Xabarlarini Olish**
```
GET /api/chats/{chatId}/messages
```
**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `limit` (optional, default: 50) - Nechta xabar olish
- `offset` (optional, default: 0) - Qayerdan boshlash

**Example:**
```
GET /api/chats/1/messages?limit=20&offset=0
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "chat_id": 1,
        "sender_id": 1,
        "content": "Salomu aleykum!",
        "sent_at": "2026-04-19 10:00:00",
        "sent_at_uz": "2026-04-19 15:00:00",
        "sender_name": "John Doe",
        "sender_phone": "+998901234567"
      },
      {
        "id": 2,
        "chat_id": 1,
        "sender_id": 2,
        "content": "Aleykum assalom! Qal holinasan?",
        "sent_at": "2026-04-19 10:02:15",
        "sent_at_uz": "2026-04-19 15:02:15",
        "sender_name": "Alice Smith",
        "sender_phone": "+998902345678"
      }
    ]
  }
}
```

---

### 9️⃣ **SEND MESSAGE (REST) - Chat'ga Xabar Yuborish**
```
POST /api/chats/{chatId}/messages
```
**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Nima Yuborish Kerak:**
```json
{
  "content": "Bu yangi xabar!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Xabar yuborildi",
  "data": {
    "message": {
      "id": 3,
      "chat_id": 1,
      "sender_id": 1,
      "content": "Bu yangi xabar!",
      "sent_at": "2026-04-19 15:30:45",
      "sent_at_uz": "2026-04-19 20:30:45",
      "sender_name": "John Doe",
      "sender_phone": "+998901234567"
    }
  }
}
```

---

### 🔟 **DELETE MESSAGE - Chatdagi Xabarni O'chirish**
```
DELETE /api/chats/{chatId}/messages/{messageId}
```
**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Example:**
```
DELETE /api/chats/1/messages/3
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Xabar o'chirildi",
  "data": {
    "messageId": 3,
    "chatId": 1,
    "deleted": true
  }
}
```

Eslatma: faqat xabar yuborgan foydalanuvchi o‘chira oladi.

---

## 🔌 **SOCKET.IO REAL-TIME API'LARI**

Socket.IO real-time xabarlashtirish uchun ishlatiladi. Avval server'ga ulanish kerak.

### **Socket.IO Ulanish**
```javascript
const socket = io('http://localhost:4444', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

---

### 🔟 **JOIN CHATS - Barcha Chatlarni Ulash**
**Yuboriladi (Emit):**
```javascript
socket.emit('join_chats', {});
```

**Javob (Receive):**
```javascript
socket.on('joined_chats', (response) => {
  console.log(response);
  // {
  //   success: true,
  //   message: "Chatlarga ulandi"
  // }
});
```

---

### 1️⃣1️⃣ **JOIN SPECIFIC CHAT - Muayyan Chatga Ulash**
**Yuboriladi (Emit):**
```javascript
socket.emit('join_chat', {
  chatId: 1
});
```

**Javob (Receive):**
```javascript
socket.on('joined_chat', (response) => {
  console.log(response);
  // {
  //   success: true,
  //   chatId: 1,
  //   message: "Chatga ulandi"
  // }
});
```

---

### 1️⃣2️⃣ **SEND MESSAGE (SOCKET) - Real-Time Xabar Yuborish**
**Yuboriladi (Emit):**
```javascript
socket.emit('send_message', {
  chatId: 1,
  content: "Salomu aleykum hamisha!"
});
```

**Javob (Receive) - Faqat Yuboruvchi:**
```javascript
// Yuboruvchi o'zini qabul qiladi (optional)
socket.on('message_sent', (response) => {
  console.log(response);
});
```

**Hammasi Uchun (Broadcast) - Chat'da Barcha:**
```javascript
socket.on('new_message', (response) => {
  console.log(response);
  // {
  //   success: true,
  //   data: {
  //     message: {
  //       id: 10,
  //       chat_id: 1,
  //       sender_id: 1,
  //       content: "Salomu aleykum hamisha!",
  //       sent_at: "2026-04-19 16:00:00",
  //       sent_at_uz: "2026-04-19 21:00:00",
  //       sender_name: "John Doe",
  //       sender_phone: "+998901234567"
  //     }
  //   }
  // }
});
```

---

### 1️⃣3️⃣ **CREATE CHAT (SOCKET) - Real-Time Chat Yaratish**
**Yuboriladi (Emit):**
```javascript
socket.emit('create_chat', {
  targetPhone: '+998903456789'
});
```

**Javob (Receive) - Yuboruvchi:**
```javascript
socket.on('chat_created', (response) => {
  console.log(response);
  // {
  //   success: true,
  //   message: "Yangi chat yaratildi",
  //   data: {
  //     chat: {
  //       id: 4,
  //       name: null,
  //       type: "private",
  //       participant_ids: "1,3",
  //       participant_phones: "+998901234567,+998903456789",
  //       participant_names: "John Doe,Bob Wilson",
  //       created_at: "2026-04-19 10:35:00",
  //       created_at_uz: "2026-04-19 15:35:00"
  //     }
  //   }
  // }
});
```

**Javob (Receive) - Target Foydalanuvchi (Agar Online Bo'lsa):**
```javascript
socket.on('new_chat', (response) => {
  console.log(response);
  // Yangi chat haqida notifikatsiya oladi
  // {
  //   success: true,
  //   data: {
  //     chat: {...}
  //   }
  // }
});
```

---

### 1️⃣4️⃣ **TYPING INDICATOR - Yozayotgan Ekanligini Bildirish**
**Yuboriladi (Emit):**
```javascript
// Yozayotganida
socket.emit('typing', {
  chatId: 1,
  isTyping: true
});

// Yozishni tugatganida
socket.emit('typing', {
  chatId: 1,
  isTyping: false
});
```

**Hammasi Uchun (Broadcast) - Boshqa Foydalanuvchilar:**
```javascript
socket.on('user_typing', (data) => {
  console.log(data);
  // {
  //   userId: 1,
  //   name: "John Doe",
  //   phone: "+998901234567",
  //   isTyping: true
  // }
});
```

---

### 1️⃣5️⃣ **DISCONNECT - Disconnection**
```javascript
socket.on('disconnect', () => {
  console.log('Serverdan uzildi');
});
```

---

## ⚠️ **ERROR RESPONSES**

Barcha API'lar error bo'lsa bu formatda qaytaradi:

```json
{
  "success": false,
  "message": "Xatolik sababi"
}
```

**HTTP Status Codes:**
- `200` - OK
- `201` - Created
- `400` - Bad Request (Noto'g'ri ma'lumotlar)
- `401` - Unauthorized (Token yo'q yoki noto'g'ri)
- `403` - Forbidden (Huquqingiz yo'q)
- `404` - Not Found (Topilmadi)
- `500` - Server Error

---

## 🎯 **HEALTH CHECK - Server Sog'ligi Tekshirish**
```
GET /
```

**Response:**
```json
{
  "success": true,
  "message": "Chat Server ishlamoqda",
  "timestamp": "2026-04-19T16:30:45.123Z",
  "documentation": "http://localhost:4444/api-docs"
}
```

---

## 📖 **SWAGGER DOKUMENTATSIYA**

API dokumentatsiyasini Swagger UI'da ko'rish uchun:
```
http://localhost:4444/api-docs
```

---

**Token Muntazamlikligi:** 7 kun
