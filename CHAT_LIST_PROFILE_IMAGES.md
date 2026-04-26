# Chatlar ro‘yxatida profil rasmlarini ko‘rsatish (Telegram kabi)

Sana: **2026-04-26**

Maqsad: agar boshqa foydalanuvchi profiliga rasm qo‘ygan bo‘lsa, u rasm sizning **chatlar ro‘yxatingizda** ham ko‘rinishi.

## Nima o‘zgardi?

### 1) `GET /api/chats` response kengaydi (yangi maydonlar)

Har bir chat obyektida endi qo‘shimcha ravishda:
- `participants`: participantlar ro‘yxati (array)
  - `id`, `name`, `phone`, `profile_image`, `profile_image_url`
- `display_name`: chat list uchun qulay nom
  - `private` chat bo‘lsa: sizdan boshqa user’ning ismi
  - `group` bo‘lsa: `chat.name`
- `display_image_url`: chat list uchun qulay avatar
  - `private` chat bo‘lsa: sizdan boshqa user’ning `profile_image_url`
  - `group` bo‘lsa: hozircha `null`

Eslatma:
- Oldingi `participant_names`, `participant_phones`, `participant_profile_images` maydonlari ham saqlanib qolgan (orqaga moslik uchun).

### 2) `GET /api/chats/:chatId` response ham kengaydi

`data.chat.participants` qaytadi (xuddi yuqoridagidek `profile_image_url` bilan).

## Frontend qanday ishlatadi?

- Chat list item avatar: `display_image_url`
- Chat list item title: `display_name`
- Agar `display_image_url` `null` bo‘lsa: default avatar ko‘rsating.

## Static fayllar

Profil rasmlar:
- serverda `/uploads/avatars/...` ga saqlanadi
- browserdan `GET /uploads/...` orqali ochiladi

