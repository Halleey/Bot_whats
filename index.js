const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleStickerRequest } = require('./service/stickers/stickerService'); 
const { handleWelcomeMessage } = require('./service/welcomeHandler'); 
const { handleAnimatedStickerRequest } = require('./service/stickers/animatedStickerService'); 
const { handleVideoToStickerRequest } = require('./service/stickers/videoSticker');
const { handleStickerToMedia } = require('./service/convert/StickerConvert');
const { handleMuteCommand, handleMutedMessages } = require('./service/groups/Admin'); 
const {handlePlayCommand} = require('./service/audios/PlayMusic')


const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp conectado.');
});

// Manipulação de mensagens
client.on('message', async (msg) => {
   
    if (msg.body.startsWith('!play')) {
        await handlePlayCommand(client, msg); // Processa o comando !play
    }


        if (msg.body.startsWith('/mute') || msg.body.startsWith('/desmute')) {
            await handleMuteCommand(client, msg); // Processa comandos de mute e desmute
        }


        // Verifica se o autor da mensagem está silenciado
        await handleMutedMessages(client, msg);

        // Outras funcionalidades do bot
        await handleWelcomeMessage(client, msg);
        await handleStickerRequest(client, msg);
        await handleVideoToStickerRequest(client, msg);
        await handleStickerToMedia(client, msg);
        await handleAnimatedStickerRequest(client, msg);
    
});

client.initialize();

module.exports = client;
