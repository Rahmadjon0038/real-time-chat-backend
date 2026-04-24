# 🗑️ Chatni ro‘yxatdan o‘chirish (HIDE) — ishlatish qo‘llanmasi

Bu qo‘llanma yangi qo‘shilgan endpoint haqida: chatni **faqat sizning chatlar ro‘yxatingizdan** olib tashlash (hide).

## Nima qiladi?
- Chat DB’dan o‘chmaydi.
- Chat **faqat joriy user** uchun `GET /api/chats` ro‘yxatidan yo‘qoladi.
- Chatning boshqa participant(lar)i uchun chat ro‘yxatda qoladi.
- Shu chatga **yangi xabar** kelganda chat avtomatik yana ro‘yxatda paydo bo‘ladi (unhide).

---

## Endpoint
`DELETE /api/chats/:chatId`

### Auth
`Authorization: Bearer <JWT_TOKEN>`

---

## Tezkor ishlatish (curl)

1) Tokenni o‘rnatib oling:
```bash
export TOKEN="PASTE_YOUR_JWT_HERE"
```

2) Chatni ro‘yxatdan o‘chirish (hide):
```bash
curl -s -X DELETE http://localhost:4444/api/chats/1 \
  -H "Authorization: Bearer $TOKEN" | jq
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

`hidden: true` — chat birinchi marta hide qilindi.
`hidden: false` — chat oldin ham hide bo‘lgan (yoki allaqachon hidden holatda).

---

## Hide qilinganini tekshirish

Chatlar ro‘yxatini oling:
```bash
curl -s http://localhost:4444/api/chats \
  -H "Authorization: Bearer $TOKEN" | jq
```

Agar hammasi to‘g‘ri bo‘lsa, `chatId=1` bo‘lgan chat bu ro‘yxatda ko‘rinmaydi.

---

## Xatoliklar

- `401` — token yo‘q yoki noto‘g‘ri
- `403` — siz bu chat participant’i emassiz (`Bu chatga kirish huquqingiz yo'q`)
- `500` — server xatosi

---

## Muhim eslatma (unhide qachon bo‘ladi?)

Quyidagi holatlarda chat qaytib ro‘yxatda ko‘rinadi:
- Shu chatga yangi message yozilganda (REST `POST /api/chats/:chatId/messages` yoki Socket `send_message`)
- Yoki mavjud private chatga qayta kirilganda: `POST /api/chats/create` (target user bilan) chatni siz uchun unhide qiladi

