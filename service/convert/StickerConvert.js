const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const ffmpegPath = 'C:/Users/apare/Downloads/ffmpeg/bin/ffmpeg.exe';
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const handleStickerToMedia = async (client, msg) => {
    if (!msg.hasQuotedMsg || msg.body.trim() !== '!converta') {
        return;
    }

    try {
        const quotedMsg = await msg.getQuotedMessage();

        // Verificar se a mensagem respondida contém uma figurinha
        if (!quotedMsg.hasMedia || quotedMsg.type !== 'sticker') {
            await client.sendMessage(msg.from, 'Por favor, responda a uma figurinha com o comando "!converta".');
            return;
        }

        console.log('[DEBUG] Figurinha recebida, iniciando download...');
        const media = await quotedMsg.downloadMedia();

        
        if (!media || !media.data) {
            console.error('[ERROR] Figurinha não foi baixada corretamente:', media);
            await client.sendMessage(msg.from, 'Não foi possível baixar a figurinha. Tente novamente.');
            return;
        }

        console.log('[DEBUG] Figurinha baixada com sucesso.');
        const buffer = Buffer.from(media.data, 'base64');
        const tempStickerPath = path.resolve(__dirname, 'temp_sticker.webp');
        const outputPath = path.resolve(__dirname, 'output_media');

        // Salvar a figurinha temporariamente
        fs.writeFileSync(tempStickerPath, buffer);
        console.log(`[DEBUG] Figurinha salva temporariamente em: ${tempStickerPath}`);

        // Converter figurinha estática para imagem PNG
        const imageOutputPath = `${outputPath}.png`;

        console.log('[DEBUG] Convertendo figurinha estática para imagem...');
        await new Promise((resolve, reject) => {
            ffmpeg(tempStickerPath)
                .output(imageOutputPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        console.log('[DEBUG] Conversão para imagem concluída. Enviando...');
        const imageMedia = MessageMedia.fromFilePath(imageOutputPath);
        await client.sendMessage(msg.from, imageMedia);

    } catch (error) {
        console.error('[ERROR] Erro ao processar a figurinha:', error);
        await client.sendMessage(msg.from, 'Ocorreu um erro ao converter a figurinha. Tente novamente.');
    } finally {
        // Limpeza dos arquivos temporários após o envio
        try {
            const tempStickerPath = path.resolve(__dirname, 'temp_sticker.webp');
            const imageOutputPath = path.resolve(__dirname, 'output_media.png');

            if (fs.existsSync(tempStickerPath)) {
                fs.unlinkSync(tempStickerPath);
                console.log('[DEBUG] Arquivo temporário de figurinha removido.');
            }

            if (fs.existsSync(imageOutputPath)) {
                fs.unlinkSync(imageOutputPath);
                console.log('[DEBUG] Arquivo de imagem temporário removido.');
            }
        } catch (cleanupError) {
            console.error('[ERROR] Erro ao limpar arquivos temporários:', cleanupError);
        }
    }
};

module.exports = { handleStickerToMedia };
