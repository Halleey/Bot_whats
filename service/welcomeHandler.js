const fs = require('fs');
const path = require('path');

// Caminho do arquivo para armazenar os contatos que já receberam a mensagem de boas-vindas
const welcomeContactsFilePath = path.resolve(__dirname, '../welcomeContacts.json');

// Função para verificar se o usuário já recebeu a mensagem de boas-vindas
const getWelcomeContacts = () => {
    if (fs.existsSync(welcomeContactsFilePath)) {
        return JSON.parse(fs.readFileSync(welcomeContactsFilePath));
    }
    return [];
};

// Função para salvar o contato no arquivo
const saveWelcomeContact = (contactId) => {
    const contacts = getWelcomeContacts();
    contacts.push(contactId);
    fs.writeFileSync(welcomeContactsFilePath, JSON.stringify(contacts));
};
const handleWelcomeMessage = async (client, msg) => {
    try {
        const welcomeContacts = getWelcomeContacts();

        // Comando !menu
        if (msg.body.trim().toLowerCase() === '!menu') {
            const menuMessage = `
            Olá! Eu sou o bot e estou aqui para te ajudar.

            Comandos disponíveis:
            **envie o arquivo com a legenda embaixo com o comando respectivo**
            - !sticker: Envie uma imagem e eu a transformarei em uma figurinha para você.
            - !s: Envie um gif e transformo em figurinha animada.
            - !animado: Envie um vídeo curto de até 10 segundos e transformo em figurinhas.
            - !converta: Envie uma figurinha e após isso marque a mesma com a frase !converta para transformar em imagem.
            - !menu: Para verificar os comandos.
            Fique à vontade para me chamar sempre que precisar!
            `;

            // Envia a mensagem de boas-vindas quando o comando !menu for invocado
            await client.sendMessage(msg.from, menuMessage);
            return; // Impede que a lógica de boas-vindas padrão seja executada para esse comando
        }

        // Verifica se o contato já recebeu a mensagem de boas-vindas
        if (!welcomeContacts.includes(msg.from)) {
            const firstMessage = `
            Olá! Eu sou o bot e estou aqui para te ajudar.

            Comandos disponíveis:
            **envie o arquivo com a legenda embaixo com o comando respectivo**
            - !sticker: Envie uma imagem e eu a transformarei em uma figurinha para você.
            - !s: Envie um gif e transformo em figurinha animada.
            - !animado: Envie um vídeo curto de até 10 segundos e transformo em figurinhas.
            - !converta: Envie uma figurinha e após isso marque a mesma com a frase !converta para transformar em imagem.
            - !menu: Para verificar os comandos.
            Fique à vontade para me chamar sempre que precisar!
            `;

            // Envia a mensagem de boas-vindas
            await client.sendMessage(msg.from, firstMessage);

            // Salva o contato para não enviar novamente
            saveWelcomeContact(msg.from);
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem de boas-vindas:', error);
    }
};

module.exports = { handleWelcomeMessage };
