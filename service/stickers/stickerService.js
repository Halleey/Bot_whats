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
    if (msg.hasMedia && msg.body === '!sticker') {
        // Criando a figurinha
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
};

// Exportando a função para uso no arquivo principal
module.exports = { handleStickerRequest };
