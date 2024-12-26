const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { MessageMedia } = require('whatsapp-web.js');

async function handlePlayCommand(client, msg) {
    const content = msg.body.split(' ');
    if (content.length < 2) {
        await msg.reply('Por favor, forneça o nome ou o link da música após o comando `!play`.');
        console.log('Comando inválido. Não foi fornecido nenhum nome ou link.');
        return;
    }

    const query = content.slice(1).join(' ');
    const fileName = 'audio.mp3';
    const filePath = path.join(__dirname, '../../../downloads', fileName);
    const oggFilePath = path.join(__dirname, '../../../downloads', 'audio.ogg');

    // Verifica se o diretório 'downloads' existe, caso contrário, cria
    if (!fs.existsSync(path.dirname(filePath))) {
        console.log('Diretório "downloads" não encontrado. Criando diretório...');
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    try {
        console.log(`Iniciando busca pela música: ${query}`);
        await msg.reply(`Buscando a música: *${query}*`);

        // Usa youtube-dl-exec para baixar o áudio
        const downloadOptions = {
            output: filePath,
            extractAudio: true,
            audioFormat: 'mp3',
        };

        console.log('Opções de download:', downloadOptions);

        await youtubedl(`ytsearch1:${query}`, downloadOptions);

        console.log(`Arquivo baixado com sucesso: ${filePath}`);

        // Verifica se o arquivo foi criado
        if (fs.existsSync(filePath)) {
            console.log('Arquivo encontrado. Preparando para converter e enviar...');

            // Converte o arquivo MP3 para OGG usando ffmpeg
            ffmpeg(filePath)
                .audioCodec('libopus')
                .audioBitrate(128)
                .toFormat('ogg')
                .on('end', () => {
                    console.log('Conversão concluída.');

                    // Cria a mensagem de mídia a partir do arquivo OGG
                    const media = MessageMedia.fromFilePath(oggFilePath);

                    // Envia o áudio para o usuário
                    client.sendMessage(msg.from, media, { sendAudioAsVoice: true })
                        .then(() => {
                            console.log('Áudio enviado com sucesso.');

                            // Excluir arquivos temporários após o envio
                            fs.unlinkSync(filePath);
                            fs.unlinkSync(oggFilePath);
                        })
                        .catch((sendError) => {
                            console.error('Erro ao enviar o áudio:', sendError);
                            msg.reply('Não foi possível enviar a música. Por favor, tente novamente.');
                        });
                })
                .on('error', (err) => {
                    console.error('Erro na conversão:', err);
                    msg.reply('Houve um erro ao processar a música. Por favor, tente novamente.');
                })
                .save(oggFilePath);
        } else {
            console.error('Erro: Arquivo baixado não encontrado.');
            await msg.reply('Houve um problema ao processar o download. O arquivo não foi encontrado.');
        }
    } catch (error) {
        console.error('Erro ao baixar ou processar a música:', error);
        await msg.reply('Houve um problema ao buscar ou baixar a música. Por favor, tente novamente mais tarde.');
    }
}

module.exports = {
    handlePlayCommand,
};
