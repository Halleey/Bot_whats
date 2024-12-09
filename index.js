const { createTable } = require('./db');
const { client } = require('./whatsappBot');
const { saveTask } = require('./taskManager');

// Cria as tabelas no banco de dados
createTable();

// Inicializa o cliente do WhatsApp
client.initialize();
