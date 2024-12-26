const { MessageMedia } = require('whatsapp-web.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Função responsável por processar a imagem e gerar a figurinha
const createSticker = async (buffer) => {
    const stickerPath = path.resolve(__dirname, '../sticker.png'); // Caminho do arquivo de saída

    // Usando sharp para redimensionar a imagem sem distorcer, mantendo fundo transparente
    await sharp(buffer)
        .resize(512, 512, { fit: 'contain' }) // Ajusta o tamanho da imagem para 512x512
        .png()
        .toFile(stickerPath);

    return stickerPath;
};

// Função que lida com a mensagem, verificando se é uma solicitação de figurinha
const handleStickerRequest = async (client, msg) => {
    if (msg.body === '!sticker' && msg.hasMedia) {
        // Caso o usuário envie uma imagem com !sticker
        const media = await msg.downloadMedia(); // Faz o download da mídia
        const buffer = Buffer.from(media.data, 'base64');
        const stickerPath = await createSticker(buffer); // Cria a figurinha

        // Envia a figurinha criada de volta como uma mensagem
        const stickerMedia = new MessageMedia('image/png', fs.readFileSync(stickerPath).toString('base64'), 'sticker.png');
        await client.sendMessage(msg.from, stickerMedia, { sendMediaAsSticker: true });

        // Remove o arquivo temporário
        fs.unlinkSync(stickerPath);
        console.log('Figurinha enviada com sucesso!');
    } 
    else if (msg.hasQuotedMsg && msg.body === '!sticker') {
        // Caso o usuário marque uma imagem com !sticker
        const quotedMsg = await msg.getQuotedMessage();

        // Verifica se a mensagem marcada contém mídia
        if (quotedMsg.hasMedia) {
            const media = await quotedMsg.downloadMedia(); // Faz o download da mídia
            const buffer = Buffer.from(media.data, 'base64');
            const stickerPath = await createSticker(buffer); // Cria a figurinha

            // Envia a figurinha criada de volta como uma mensagem
            const stickerMedia = new MessageMedia('image/png', fs.readFileSync(stickerPath).toString('base64'), 'sticker.png');
            await client.sendMessage(msg.from, stickerMedia, { sendMediaAsSticker: true });

            // Remove o arquivo temporário
            fs.unlinkSync(stickerPath);
            console.log('Figurinha enviada com sucesso!');
        } else {
            // Caso a mensagem marcada não contenha mídia
            await client.sendMessage(msg.from, 'Por favor, marque uma mensagem que contenha uma imagem para ser convertida em figurinha.');
        }
    }
};

// Exportando a função para uso no arquivo principal
module.exports = { handleStickerRequest };
