const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const ffmpegPath = 'C:/Users/apare/Downloads/ffmpeg/bin/ffmpeg.exe'; // Caminho para o ffmpeg
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

// Função para criar o sticker animado em WebP a partir de um vídeo
const createWebPStickerFromVideo = async (videoPath) => {
    try {
        const webpPath = path.resolve(__dirname, '../animated_sticker.webp');

        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .outputOptions('-vf', 'fps=10,scale=512:512') // Define o FPS e escala do WebP
                .output(webpPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // Verifica se o arquivo WebP foi gerado com sucesso
        if (!fs.existsSync(webpPath)) {
            throw new Error('Erro: O WebP não foi gerado corretamente.');
        }

        return webpPath;
    } catch (error) {
        console.error('Erro ao criar o sticker animado:', error);
        throw new Error('Falha ao criar o sticker animado.');
    }
};

// Função que lida com o vídeo recebido do usuário e cria a figurinha animada
const handleVideoToStickerRequest = async (client, msg) => {
    if (!msg.hasMedia || !msg.body.trim().startsWith('!animado')) {
        return; // Ignora se não for o comando ou não houver mídia
    }

    try {
        console.log('Mídia recebida, baixando...');

        // Baixa o vídeo enviado pelo usuário
        const media = await msg.downloadMedia();
        
        // Verifica se a mídia foi baixada corretamente
        if (!media || !media.data) {
            console.error('Erro ao baixar a mídia', media);
            await client.sendMessage(msg.from, 'Não foi possível baixar o vídeo. Tente novamente.');
            return;
        }

        console.log('Mídia baixada com sucesso');

        // Converte o vídeo para um buffer
        const buffer = Buffer.from(media.data, 'base64');
        const tempVideoPath = path.resolve(__dirname, 'temp_video.mp4');

        // Salva o vídeo temporariamente no servidor
        fs.writeFileSync(tempVideoPath, buffer);

        // Cria o sticker animado em WebP
        const webpPath = await createWebPStickerFromVideo(tempVideoPath);

        // Cria o MessageMedia para enviar como sticker
        const webpMedia = new MessageMedia(
            'image/webp',
            fs.readFileSync(webpPath).toString('base64'),
            'animated_sticker.webp'
        );

        // Envia a figurinha animada para o usuário
        await client.sendMessage(msg.from, webpMedia, { sendMediaAsSticker: true });

        console.log('Sticker animado enviado com sucesso!');
    } catch (error) {
        console.error('Erro ao processar o sticker animado:', error);
        await client.sendMessage(msg.from, 'Ocorreu um erro ao criar o sticker animado. arquivo excede o limite permitido.');
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
module.exports = { handleVideoToStickerRequest };
