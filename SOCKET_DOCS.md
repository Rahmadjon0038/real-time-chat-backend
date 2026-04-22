# Socket.IO Real-Time Events Dokumentatsiyasi

Real vaqt chat uchun Socket.IO event'lari.

## Ulanish

Socket.IO clientdan serverga ulanish uchun JWT token kerak:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4444', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

## Client -> Server Events

### `join_chats`
Foydalanuvchining barcha chatlariga ulanish.

**Parameters:** Yo'q

**Example:**
```javascript
socket.emit('join_chats');
```

**Response:** `joined_chats` event

---

### `join_chat`
Ma'lum bir chatga ulanish.

**Parameters:**
```typescript
{
  chatId: number
}
```

**Example:**
```javascript
socket.emit('join_chat', {
  chatId: 1
});
```

**Response:** `joined_chat` yoki `error` event

---

### `send_message`
Chatga xabar yuborish.

**Parameters:**
```typescript
{
  chatId: number;
  content: string;
}
```

**Example:**
```javascript
socket.emit('send_message', {
  chatId: 1,
  content: 'Salom, qalaysan?'
});
```

**Response:** `new_message` event barcha chat ishtirokchilariga yuboriladi

---

### `create_chat`
Yangi chat yaratish yoki mavjudini topish.

**Parameters:**
```typescript
{
  targetPhone: string;
}
```

**Example:**
```javascript
socket.emit('create_chat', {
  targetPhone: '+998901234567'
});
```

**Response:** `chat_created` event va target foydalanuvchiga `new_chat` event

---

### `typing`
Yozish indikatori.

**Parameters:**
```typescript
{
  chatId: number;
  isTyping: boolean;
}
```

**Example:**
```javascript
// Yozish boshlanganida
socket.emit('typing', {
  chatId: 1,
  isTyping: true
});

// Yozish to'xtaganida
socket.emit('typing', {
  chatId: 1,
  isTyping: false
});
```

**Response:** `user_typing` event boshqa chat ishtirokchilariga yuboriladi

---

## Server -> Client Events

### `joined_chats`
Chatlarga muvaffaqiyatli ulanganlik haqida.

**Data:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Example:**
```javascript
socket.on('joined_chats', (data) => {
  console.log('Chatlarga ulandi:', data.message);
});
```

---

### `joined_chat`
Ma'lum chatga ulanganlik haqida.

**Data:**
```typescript
{
  success: boolean;
  chatId: number;
  message: string;
}
```

**Example:**
```javascript
socket.on('joined_chat', (data) => {
  console.log(`Chat ${data.chatId} ga ulandi:`, data.message);
});
```

---

### `new_message`
Yangi xabar kelganligi haqida.

**Data:**
```typescript
{
  success: boolean;
  data: {
    message: {
      id: number;
      chat_id: number;
      sender_id: number;
      sender_username: string;
      sender_name: string;
      sender_phone: string;
      content: string;
      sent_at: string;
      sent_at_uz: string;
    }
  }
}
```

**Example:**
```javascript
socket.on('new_message', (data) => {
  const message = data.data.message;
  console.log(`Yangi xabar ${message.sender_name}dan:`, message.content);
});
```

---

### `chat_created`
Yangi chat yaratilganligi yoki mavjud chat topilganligi haqida.

**Data:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    chat: {
      id: number;
      name: string | null;
      type: 'private' | 'group';
      participant_ids: string;
      participant_usernames: string;
      participant_phones: string;
      participant_names: string;
      created_at: string;
      created_at_uz: string;
    }
  }
}
```

**Example:**
```javascript
socket.on('chat_created', (data) => {
  const chat = data.data.chat;
  console.log('Chat yaratildi/topildi:', chat.id);
});
```

---

### `new_chat`
Boshqa foydalanuvchi siz bilan chat yaratganligi haqida.

**Data:**
```typescript
{
  success: boolean;
  data: {
    chat: {
      id: number;
      name: string | null;
      type: 'private' | 'group';
      participant_ids: string;
      participant_usernames: string;
      participant_names: string;
      created_at: string;
    }
  }
}
```

**Example:**
```javascript
socket.on('new_chat', (data) => {
  const chat = data.data.chat;
  console.log('Yangi chat ochildi:', chat.id);
});
```

---

### `user_typing`
Boshqa foydalanuvchi yozayotganligi haqida.

**Data:**
```typescript
{
  userId: number;
  username: string;
  phone: string;
  isTyping: boolean;
}
```

**Example:**
```javascript
socket.on('user_typing', (data) => {
  if (data.isTyping) {
    console.log(`${data.username} yozmoqda...`);
  } else {
    console.log(`${data.username} yozishni to'xtatdi`);
  }
});
```

---

### `error`
Xatolik haqida xabar.

**Data:**
```typescript
{
  success: false;
  message: string;
}
```

**Example:**
```javascript
socket.on('error', (data) => {
  console.error('Socket xatolik:', data.message);
});
```

---

## To'liq Frontend Misol

```javascript
import io from 'socket.io-client';

// Ulanish
const socket = io('http://localhost:4444', {
  auth: {
    token: localStorage.getItem('token')
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Serverga ulandi');
  socket.emit('join_chats');
});

socket.on('disconnect', () => {
  console.log('Server bilan aloqa uzildi');
});

// Chat events
socket.on('joined_chats', (data) => {
  console.log('Chatlarga ulandi');
});

socket.on('new_message', (data) => {
  const message = data.data.message;
  // UI'da yangi xabarni ko'rsatish
  displayMessage(message);
});

socket.on('new_chat', (data) => {
  const chat = data.data.chat;
  // Chatlar ro'yxatiga yangi chat qo'shish
  addChatToList(chat);
});

socket.on('user_typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.username);
  } else {
    hideTypingIndicator(data.username);
  }
});

// Xabar yuborish funksiyasi
function sendMessage(chatId, content) {
  socket.emit('send_message', {
    chatId: chatId,
    content: content
  });
}

// Chat yaratish funksiyasi
function createChat(targetPhone) {
  socket.emit('create_chat', {
    targetPhone: targetPhone
  });
}

// Typing indicator
function handleTyping(chatId, isTyping) {
  socket.emit('typing', {
    chatId: chatId,
    isTyping: isTyping
  });
}
```
