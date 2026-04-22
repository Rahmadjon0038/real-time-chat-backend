const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Real-Time Chat API',
      version: '1.0.0',
      description: 'SQLite3 va Socket.IO ishlatilgan real vaqt chat API dokumentatsiyasi',
      contact: {
        name: 'Chat API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'name', 'phone', 'password'],
          properties: {
            id: {
              type: 'integer',
              description: 'Foydalanuvchi ID'
            },
            username: {
              type: 'string',
              description: 'Unique username',
              example: 'john_doe'
            },
            name: {
              type: 'string',
              description: 'To\'liq ism',
              example: 'John Doe'
            },
            phone: {
              type: 'string',
              description: 'Telefon raqami',
              example: '+998901234567'
            },
            password: {
              type: 'string',
              description: 'Parol (faqat kiritishda)',
              example: 'parol123'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Yaratilgan vaqt'
            }
          }
        },
        Chat: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Chat ID'
            },
            name: {
              type: 'string',
              description: 'Chat nomi (group chat uchun)',
              nullable: true
            },
            type: {
              type: 'string',
              enum: ['private', 'group'],
              description: 'Chat turi'
            },
            participant_usernames: {
              type: 'string',
              description: 'Ishtirokchilar usernamelari (vergul bilan ajratilgan)'
            },
            participant_phones: {
              type: 'string',
              description: 'Ishtirokchilar telefon raqamlari (vergul bilan ajratilgan)'
            },
            participant_names: {
              type: 'string',
              description: 'Ishtirokchilar ismlari (vergul bilan ajratilgan)'
            },
            last_message: {
              type: 'string',
              description: 'Oxirgi xabar matni'
            },
            last_message_time: {
              type: 'string',
              format: 'date-time',
              description: 'Oxirgi xabar vaqti'
            },
            last_message_time_uz: {
              type: 'string',
              description: 'Oxirgi xabar vaqti (Asia/Tashkent, YYYY-MM-DD HH:mm:ss)'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Yaratilgan vaqt'
            },
            created_at_uz: {
              type: 'string',
              description: 'Yaratilgan vaqt (Asia/Tashkent, YYYY-MM-DD HH:mm:ss)'
            }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Xabar ID'
            },
            chat_id: {
              type: 'integer',
              description: 'Chat ID'
            },
            sender_id: {
              type: 'integer',
              description: 'Yuboruvchi ID'
            },
            sender_username: {
              type: 'string',
              description: 'Yuboruvchi username'
            },
            sender_name: {
              type: 'string',
              description: 'Yuboruvchi ismi'
            },
            sender_phone: {
              type: 'string',
              description: 'Yuboruvchi telefon raqami'
            },
            content: {
              type: 'string',
              description: 'Xabar matni'
            },
            sent_at: {
              type: 'string',
              format: 'date-time',
              description: 'Yuborilgan vaqt'
            },
            sent_at_uz: {
              type: 'string',
              description: 'Yuborilgan vaqt (Asia/Tashkent, YYYY-MM-DD HH:mm:ss)'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Muvaffaqiyat holati'
            },
            message: {
              type: 'string',
              description: 'Javob xabari'
            },
            data: {
              type: 'object',
              description: 'Ma\'lumotlar'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'name', 'phone', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Unique username',
              example: 'john_doe'
            },
            name: {
              type: 'string',
              description: 'To\'liq ism',
              example: 'John Doe'
            },
            phone: {
              type: 'string',
              description: 'Telefon raqami',
              example: '+998901234567'
            },
            password: {
              type: 'string',
              description: 'Parol',
              example: 'parol123',
              minLength: 6
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username',
              example: 'john_doe'
            },
            password: {
              type: 'string',
              description: 'Parol',
              example: 'parol123'
            }
          }
        },
        CreateChatRequest: {
          type: 'object',
          required: ['targetPhone'],
          properties: {
            targetPhone: {
              type: 'string',
              description: 'Chat ochmoqchi bo\'lgan foydalanuvchi telefon raqami',
              example: '+998901234567'
            }
          }
        },
        SendMessageRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: {
              type: 'string',
              description: 'Xabar matni',
              example: 'Salom, qalaysan?'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Xatolik xabari'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './server.js']
};

const specs = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  specs
};
