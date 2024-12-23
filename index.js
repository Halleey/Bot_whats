const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleStickerRequest } = require('./service/stickerService'); 
const { handleWelcomeMessage } = require('./service/welcomeHandler'); 
const { handleAnimatedStickerRequest } = require('./service/animatedStickerService'); 
const {handleVideoToStickerRequest} = require('./service/videoSticker');
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
        await handleWelcomeMessage(client, msg);
        
        await handleStickerRequest(client, msg);

        await handleVideoToStickerRequest(client, msg);

        await handleAnimatedStickerRequest(client, msg);
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
});

client.initialize();

module.exports = client;
