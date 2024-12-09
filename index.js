const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleIncomingMessage } = require('./service/handler');

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp conectado.');
});

client.on('message', async msg => {
    try {
        await handleIncomingMessage(client, msg);
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
});

client.initialize();

module.exports = client;
