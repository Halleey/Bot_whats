const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const ffmpegPath = 'C:/Users/apare/Downloads/ffmpeg/bin/ffmpeg.exe';
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


const createWebPStickerFromVideo = async (videoPath) => {
    try {
        console.log(`[DEBUG] Iniciando a criação do WebP a partir do vídeo: ${videoPath}`);
        const webpPath = path.resolve(__dirname, '../animated_sticker.webp');

        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                // Adicionar filtro para ajustar a rotação automaticamente
                .outputOptions(
                    '-vf',
                    'transpose=2,fps=10,scale=512:512' // `transpose=2` corrige a rotação para vídeos gravados em orientação diferente
                )
                .output(webpPath)
                .on('start', (commandLine) => {
                    console.log(`[DEBUG] FFmpeg iniciou com o comando: ${commandLine}`);
                })
                .on('end', () => {
                    console.log('[DEBUG] FFmpeg concluiu com sucesso.');
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`[ERROR] FFmpeg falhou: ${err.message}`);
                    reject(err);
                })
                .run();
        });

        // Verificar se o WebP foi gerado corretamente
        if (!fs.existsSync(webpPath)) {
            throw new Error('Erro: O arquivo WebP não foi gerado corretamente.');
        }
        console.log(`[DEBUG] WebP gerado com sucesso: ${webpPath}`);
        return webpPath;
    } catch (error) {
        console.error('[ERROR] Erro ao criar o sticker animado: possível causa : \n *arquivo inválido*, \n *não removeu o áudio* \n *tempo limite de vídeo* ', error);
        throw new Error('Falha ao criar o sticker animado.');
    }
};


const handleAnimatedStickerRequest = async (client, msg) => {
    if (msg.body.trim() !== '!s') return; // Processa apenas mensagens com o comando "!s"

    if (!msg.hasMedia) {
        await client.sendMessage(msg.from, 'Por favor, envie um vídeo junto com o comando "!s".');
        return;
    }

    try {
        console.log('[DEBUG] Mídia recebida, iniciando download...');
        const media = await msg.downloadMedia();

        // Verificar se a mídia foi baixada corretamente
        if (!media || !media.data) {
            console.error('[ERROR] Mídia não foi baixada corretamente:', media);
            await client.sendMessage(msg.from, 'Não foi possível baixar o vídeo. Tente novamente.');
            return;
        }

        console.log('[DEBUG] Mídia baixada com sucesso.');
        const buffer = Buffer.from(media.data, 'base64');
        const tempVideoPath = path.resolve(__dirname, 'temp_video.mp4');

        // Salvar o vídeo temporariamente
        fs.writeFileSync(tempVideoPath, buffer);
        console.log(`[DEBUG] Vídeo salvo temporariamente em: ${tempVideoPath}`);

        // Criar o sticker animado diretamente do vídeo para WebP
        const webpPath = await createWebPStickerFromVideo(tempVideoPath);

        // Enviar o sticker animado para o usuário
        const webpMedia = new MessageMedia(
            'image/webp',
            fs.readFileSync(webpPath).toString('base64'),
            'animated_sticker.webp'
        );
        console.log('[DEBUG] Enviando o sticker animado para o usuário...');
        await client.sendMessage(msg.from, webpMedia, { sendMediaAsSticker: true });

        console.log('[DEBUG] Sticker animado enviado com sucesso!');
    } catch (error) {
        console.error('[ERROR] Erro ao processar o sticker animado:', error);
        await client.sendMessage(msg.from, 'Ocorreu um erro ao criar o sticker animado. Tente novamente.');
    } finally {
        // Limpeza dos arquivos temporários após o envio
        try {
            const tempVideoPath = path.resolve(__dirname, 'temp_video.mp4');
            const webpPath = path.resolve(__dirname, '../animated_sticker.webp');

            if (fs.existsSync(tempVideoPath)) {
                fs.unlinkSync(tempVideoPath);
                console.log('[DEBUG] Arquivo temporário de vídeo removido.');
            }
            if (fs.existsSync(webpPath)) {
                fs.unlinkSync(webpPath);
                console.log('[DEBUG] Arquivo temporário WebP removido.');
            }
        } catch (cleanupError) {
            console.error('[ERROR] Erro ao limpar arquivos temporários:', cleanupError);
        }
    }
};

module.exports = { handleAnimatedStickerRequest };
