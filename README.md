# Real-Time Chat Backend

SQLite3 va Socket.IO ishlatilgan real vaqt chat ilovasi backend'i.

## Xususiyatlari

- ✅ Foydalanuvchi ro'yxatdan o'tishi (username, ism, telefon)
- ✅ Tizimga kirish (login/logout)
- ✅ Real vaqt xabar almashish
- ✅ Shaxsiy chat yaratish
- ✅ Chatlar ro'yxati
- ✅ JWT autentifikatsiya
- ✅ SQLite3 ma'lumotlar bazasi

## O'rnatish

```bash
npm install
```

## Ishlatish

Development rejimida:
```bash
npm run dev
```

Production rejimida:
```bash
npm start
```

Server http://localhost:4444 da ishga tushadi.

### Dockerda ishga tushirish

1. Tasvirni yig'ing:
  ```bash
  docker build -t jamshid-backend .
  ```
2. Konteynerni ishga tushiring (muhit o'zgaruvchilari uchun `.env` faylidan foydalanish tavsiya etiladi):
  ```bash
  docker run -d \
    --name jamshid-back \
    --env-file .env \
    -p 4444:4444 \
    jamshid-backend
  ```
3. Chat ma'lumotlar bazasini saqlab qolish kerak bo'lsa, host papkani ulab qo'ying:
  ```bash
  mkdir -p chat-data
  docker run -d \
    --name jamshid-back \
    --env-file .env \
    -e DB_PATH=/app/data/chat.db \
    -v $(pwd)/chat-data:/app/data \
    -p 4444:4444 \
    jamshid-backend
  ```

Swagger UI: http://localhost:4444/api-docs

### deploy.sh orqali ishga tushirish

```bash
chmod +x deploy.sh   # bir marta beriladi
./deploy.sh 5000     # 5000 o'rniga kerakli portni yozing
```

Skript quyidagilarni bajaradi:
- Docker tasvirini qayta yig'adi
- Avvalgi konteyner bo'lsa to'xtatib o'chiradi
- `chat-data/` papkasini yaratib, SQLite faylini hosytga saqlaydi
- `.env` mavjud bo'lsa, konteynerga ulab beradi
- Berilgan portga `jamshid-back` konteynerini ishga tushiradi

## API Endpoints

### Autentifikatsiya

#### POST /api/auth/register
Yangi foydalanuvchi ro'yxatdan o'tkazish.

```json
{
  "username": "john_doe",
  "name": "John Doe", 
  "phone": "+998901234567",
  "password": "parol123"
}
```

#### POST /api/auth/login
Tizimga kirish.

```json
{
  "username": "john_doe",
  "password": "parol123"
}
```

#### GET /api/auth/profile
Foydalanuvchi profilini olish. (Bearer token kerak)

#### GET /api/auth/users
Barcha foydalanuvchilar ro'yxati. (Bearer token kerak)

### Chat

#### GET /api/chats
Foydalanuvchining chatlar ro'yxati. (Bearer token kerak)

#### POST /api/chats/create
Yangi chat yaratish yoki mavjudini topish.

```json
{
  "targetPhone": "+998901234567"
}
```

#### GET /api/chats/:chatId
Chat ma'lumotlarini olish. (Bearer token kerak)

#### GET /api/chats/:chatId/messages
Chat xabarlarini olish. (Bearer token kerak)

Query parametrlari:
- `limit`: Nechta xabar (default: 50)
- `offset`: Qayerdan boshlash (default: 0)

#### POST /api/chats/:chatId/messages
Chat'ga xabar yuborish. (Bearer token kerak)

```json
{
  "content": "Salom, qalaysan?"
}
```

## Socket.IO Events

### Client -> Server

#### `join_chats`
Foydalanuvchining barcha chatlariga ulanish.

#### `join_chat`
Ma'lum bir chatga ulanish.
```json
{
  "chatId": 1
}
```

#### `send_message`
Xabar yuborish.
```json
{
  "chatId": 1,
  "content": "Salom!"
}
```

#### `create_chat`
Yangi chat yaratish.
```json
{
  "targetPhone": "+998901234567"
}
```

#### `typing`
Yozish indikatori.
```json
{
  "chatId": 1,
  "isTyping": true
}
```

### Server -> Client

#### `joined_chats`
Chatlarga muvaffaqiyatli ulanganlik haqida xabar.

#### `joined_chat`
Ma'lum chatga ulanganlik haqida xabar.

#### `new_message`
Yangi xabar kelganligi haqida.

#### `chat_created`
Yangi chat yaratilganligi haqida.

#### `new_chat`
Boshqa foydalanuvchi siz bilan chat yaratganligi haqida.

#### `user_typing`
Boshqa foydalanuvchi yozayotganligi haqida.

#### `error`
Xatolik haqida xabar.

## Ma'lumotlar bazasi strukturasi

### users
- id (INTEGER, PRIMARY KEY)
- username (TEXT, UNIQUE)
- name (TEXT)
- phone (TEXT, UNIQUE)
- password (TEXT, hashed)
- created_at (DATETIME)

### chats
- id (INTEGER, PRIMARY KEY)
- name (TEXT, nullable)
- type (TEXT: 'private' | 'group')
- created_at (DATETIME)

### chat_participants
- id (INTEGER, PRIMARY KEY)
- chat_id (INTEGER, FOREIGN KEY)
- user_id (INTEGER, FOREIGN KEY)
- joined_at (DATETIME)

### messages
- id (INTEGER, PRIMARY KEY)
- chat_id (INTEGER, FOREIGN KEY)
- sender_id (INTEGER, FOREIGN KEY)
- content (TEXT)
- sent_at (DATETIME)

## Muhit o'zgaruvchilari

`.env` fayl yarating:

```env
DB_PATH=./chat.db
APP_TIMEZONE=Asia/Tashkent
JWT_SECRET=your-very-secure-secret-key
PORT=4444
NODE_ENV=development
```

## Frontend bilan ishlatish

Frontend'da Socket.IO client ishlatish:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4444', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Chatlarga ulanish
socket.emit('join_chats');

// Xabar yuborish
socket.emit('send_message', {
  chatId: 1,
  content: 'Salom!'
});

// Xabar eshitish
socket.on('new_message', (data) => {
  console.log('Yangi xabar:', data.data.message);
});
```
