client.on('message', async msg => {
    try {
        // Se a mensagem tiver uma imagem anexada e o comando for "!sticker"
        if (msg.hasMedia && msg.body === '!sticker') {
            const media = await msg.downloadMedia(); // Faz o download da mídia
            const stickerPath = path.resolve(__dirname, 'sticker.png');

            // Processa a mídia para criar a figurinha
            const buffer = Buffer.from(media.data, 'base64');

            // Usando sharp para redimensionar e garantir fundo transparente
            await sharp(buffer)
                .resize(512, 512, { fit: 'cover' }) // Ajusta o tamanho para 512x512, sem distorcer
                .extend({
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: { r: 255, g: 255, b: 255, alpha: 0 } // Fundo transparente
                })
                .png()
                .toFile(stickerPath);

            // Envia a figurinha de volta como sticker
            await msg.reply('Criando sua figurinha...');

            const stickerMedia = new MessageMedia('image/png', fs.readFileSync(stickerPath).toString('base64'), 'sticker.png');

            // Envia a figurinha como uma resposta
            await client.sendMessage(msg.from, stickerMedia, { sendMediaAsSticker: true });

            // Remove o arquivo temporário
            fs.unlinkSync(stickerPath);

            console.log('Figurinha enviada com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        await msg.reply('Erro ao criar figurinha. Tente novamente.');
    }
});

client.initialize();

module.exports = client;
