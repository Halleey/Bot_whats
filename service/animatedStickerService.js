const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const ffmpegPath = 'C:/Users/apare/Downloads/ffmpeg/bin/ffmpeg.exe';
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


const createWebPStickerFromVideo = async (videoPath) => {
    try {
        const webpPath = path.resolve(__dirname, '../animated_sticker.webp');

        
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .outputOptions('-vf', 'fps=6,scale=512:512') 
                .output(webpPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // Verifique se o WebP foi gerado corretamente
        if (!fs.existsSync(webpPath)) {
            throw new Error('Erro: O WebP não foi gerado corretamente.');
        }

        return webpPath;
    } catch (error) {
        console.error('Erro ao criar o sticker animado:', error);
        throw new Error('Falha ao criar o sticker animado.');
    }
};

// Função para lidar com o comando "!s"
const handleAnimatedStickerRequest = async (client, msg) => {
    if (msg.body.trim() !== '!s') return; // Só processa a mensagem com o comando "!s"

    if (!msg.hasMedia) {
        await client.sendMessage(msg.from, 'Por favor, envie um vídeo junto com o comando "!s".');
        return;
    }

    try {
        console.log('Mídia recebida, baixando...');
        const media = await msg.downloadMedia();

        // Verificar se a mídia foi baixada corretamente
        if (!media || !media.data) {
            console.error('Erro ao baixar a mídia', media);
            await client.sendMessage(msg.from, 'Não foi possível baixar o vídeo. Tente novamente.');
            return;
        }

        console.log('Mídia baixada com sucesso');

        const buffer = Buffer.from(media.data, 'base64');
        const tempVideoPath = path.resolve(__dirname, 'temp_video.mp4');

        // Salvar o vídeo temporariamente
        fs.writeFileSync(tempVideoPath, buffer);

        // Criar o sticker animado diretamente do vídeo para WebP
        const webpPath = await createWebPStickerFromVideo(tempVideoPath);

        // Enviar o sticker animado para o usuário
        const webpMedia = new MessageMedia(
            'image/webp',
            fs.readFileSync(webpPath).toString('base64'),
            'animated_sticker.webp'
        );
        await client.sendMessage(msg.from, webpMedia, { sendMediaAsSticker: true });

        console.log('Sticker animado enviado com sucesso!');
    } catch (error) {
        console.error('Erro ao processar o sticker animado:', error);
        await client.sendMessage(msg.from, 'Ocorreu um erro ao criar o sticker animado. Tente novamente.');
    } finally {
        // Limpeza dos arquivos temporários após o envio
        try {
            const tempVideoPath = path.resolve(__dirname, 'temp_video.mp4');
            const webpPath = path.resolve(__dirname, '../animated_sticker.webp');

            if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
            if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath);
        } catch (cleanupError) {
            console.error('Erro ao limpar arquivos temporários:', cleanupError);
        }
    }
};

module.exports = { handleAnimatedStickerRequest };
