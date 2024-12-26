const fs = require('fs');
const path = require('path');

const mutedUsersFilePath = path.resolve(__dirname, '../mutedUsers.json');
const getMutedUsers = () => {
    if (fs.existsSync(mutedUsersFilePath)) {
        return JSON.parse(fs.readFileSync(mutedUsersFilePath));
    }
    return {};
};

const saveMutedUsers = (mutedUsers) => {
    fs.writeFileSync(mutedUsersFilePath, JSON.stringify(mutedUsers));
};

const handleMuteCommand = async (client, msg) => {
    const args = msg.body.split(' ');
    if (args[0] === '/mute') {
        if (!msg.mentionedIds.length) {
            await client.sendMessage(msg.from, 'Você deve mencionar um usuário para silenciar.');
            return;
        }

        const mentionedId = msg.mentionedIds[0];
        const duration = parseInt(args[2], 10); // Tempo em minutos
        if (isNaN(duration)) {
            await client.sendMessage(msg.from, 'Você deve especificar o tempo de silenciamento em minutos.');
            return;
        }

        const mutedUsers = getMutedUsers();
        const unmuteTime = Date.now() + duration * 60 * 1000;

        mutedUsers[mentionedId] = unmuteTime;
        saveMutedUsers(mutedUsers);

        await client.sendMessage(msg.from, `O usuário foi silenciado por ${duration} minutos.`);
    } else if (args[0] === '/desmute') {
        if (!msg.mentionedIds.length) {
            await client.sendMessage(msg.from, 'Você deve mencionar um usuário para desmutar.');
            return;
        }

        const mentionedId = msg.mentionedIds[0];
        const mutedUsers = getMutedUsers();

        if (mutedUsers[mentionedId]) {
            delete mutedUsers[mentionedId];
            saveMutedUsers(mutedUsers);
            await client.sendMessage(msg.from, 'O usuário foi desmutado com sucesso.');
        } else {
            await client.sendMessage(msg.from, 'O usuário não está silenciado.');
        }
    }
};

// Função para verificar se um usuário está silenciado
const handleMutedMessages = async (client, msg) => {
    const mutedUsers = getMutedUsers();

    // Remover usuários cujo tempo de silenciamento expirou
    const now = Date.now();
    for (const userId in mutedUsers) {
        if (mutedUsers[userId] <= now) {
            delete mutedUsers[userId];
        }
    }
    saveMutedUsers(mutedUsers);

    // Se o usuário estiver silenciado, apagar a mensagem
    if (mutedUsers[msg.author]) {
        await msg.delete(true); // Apaga a mensagem
    }
};

module.exports = { handleMuteCommand, handleMutedMessages };
