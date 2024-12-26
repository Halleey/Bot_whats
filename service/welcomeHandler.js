const fs = require('fs');
const path = require('path');

// Caminho do arquivo para armazenar os contatos/grupos que já receberam a mensagem de boas-vindas
const welcomeContactsFilePath = path.resolve(__dirname, '../welcomeContacts.json');

// Função para verificar os contatos/grupos que já receberam a mensagem de boas-vindas
const getWelcomeContacts = () => {
    if (fs.existsSync(welcomeContactsFilePath)) {
        return JSON.parse(fs.readFileSync(welcomeContactsFilePath));
    }
    return [];
};

// Função para salvar o contato/grupo no arquivo
const saveWelcomeContact = (id) => {
    const contacts = getWelcomeContacts();
    contacts.push(id);
    fs.writeFileSync(welcomeContactsFilePath, JSON.stringify(contacts));
};

// Função para lidar com a mensagem de boas-vindas
const handleWelcomeMessage = async (client, msg) => {
    try {
        const welcomeContacts = getWelcomeContacts();
        const isGroup = msg.isGroupMsg; // Verifica se a mensagem é de um grupo
        const senderId = isGroup ? msg.chat.id : msg.from; // Identifica o remetente ou grupo

        // Comando !menu
        if (msg.body.trim().toLowerCase() === '!menu') {
            const menuMessage = `
           Olá! Eu sou o bot e estou aqui para te ajudar.
            
        Comandos disponíveis:

        💬 Envie o arquivo com a legenda embaixo junto com o comando respectivo!

        *!sticker*: Envie uma imagem e eu a transformarei em figurinha para você.
        *!s*: Envie um gif e eu transformarei em figurinha animada.
        *!animado*: Envie um vídeo curto de até 10 segundos e eu transformarei em figurinha animada.
        *!converta*: Envie uma figurinha e marque a mesma com a frase !converta para transformá-la em imagem.
        *!menu*: Para verificar os comandos. `;

            // Envia a mensagem de menu
            await client.sendMessage(senderId, menuMessage);
            return; // Impede que a lógica de boas-vindas padrão seja executada para esse comando
        }

        // Verifica se o contato/grupo já recebeu a mensagem de boas-vindas
        if (!welcomeContacts.includes(senderId)) {
            const firstMessage = `
           Olá! Eu sou o bot e estou aqui para te ajudar.

            Comandos disponíveis:

            💬 Envie o arquivo com a legenda embaixo junto com o comando respectivo!

            *!sticker*: Envie uma imagem e eu a transformarei em figurinha para você.
            *!s*: Envie um gif e eu transformarei em figurinha animada.
            *!animado*: Envie um vídeo curto de até 10 segundos e eu transformarei em figurinha animada.
            *!converta*: Envie uma figurinha e marque a mesma com a frase !converta para transformá-la em imagem.
            *!menu*: Para verificar os comandos. `;

            // Envia a mensagem de boas-vindas
            await client.sendMessage(senderId, firstMessage);

            // Salva o contato/grupo para não enviar novamente
            saveWelcomeContact(senderId);
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem de boas-vindas:', error);
    }
};

module.exports = { handleWelcomeMessage };
