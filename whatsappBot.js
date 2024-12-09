const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { query } = require('./db'); // Função para consultas ao banco de dados

// Configuração do cliente do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth()
});

// Exibe o QR Code para autenticação
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Quando o cliente estiver pronto
client.on('ready', () => {
    console.log('WhatsApp conectado.');
});

// Detecta mensagens recebidas
client.on('message', async msg => {
    const userId = msg.from; // ID do usuário
    const userInput = msg.body.trim(); // Entrada do usuário sem espaços

    // Ignora mensagens enviadas pelo próprio bot
    if (userId === client.info.wid._serialized) return;

    // Verifica se o usuário é novo e salva no banco de dados
    const userExists = await checkIfUserExists(userId);
    if (!userExists) {
        await saveNewUser(userId);
        await client.sendMessage(userId, `Olá, sou o Zard Bot! Estou aqui para ajudar você.\n\nO que deseja fazer?\n1️⃣ Salvar uma tarefa\n2️⃣ Ver suas tarefas`);
        return;
    }

    // Processa a interação com o usuário
    await handleUserInteraction(userId, userInput);
});

// Verifica se o usuário já existe no banco de dados
const checkIfUserExists = async (userId) => {
    try {
        const result = await query('SELECT id FROM usuarios WHERE id = ?', [userId]);
        return result.length > 0;
    } catch (err) {
        console.error('Erro ao verificar se o usuário existe:', err);
        return false;
    }
};

// Salva um novo usuário no banco de dados
const saveNewUser = async (userId) => {
    try {
        await query('INSERT INTO usuarios (id, nome, state) VALUES (?, ?, ?)', [userId, 'amigo(a)', 'waiting_for_task']);
        console.log(`Novo usuário salvo: ${userId}`);
    } catch (err) {
        console.error('Erro ao salvar novo usuário:', err);
    }
};

// Lida com interações do usuário
const handleUserInteraction = async (userId, userInput) => {
    const { state } = await getUserState(userId);

    // Se o estado for "finished", reinicia o processo para "waiting_for_task"
    if (state === 'finished') {
        await client.sendMessage(userId, `Olá, sou o Zard Bot! Estou aqui para ajudar você.\n\nO que deseja fazer?\n1️⃣ Salvar uma tarefa\n2️⃣ Ver suas tarefas`);
        await query('UPDATE usuarios SET state = "waiting_for_task" WHERE id = ?', [userId]);
        return;
    }

    if (state === 'awaiting_description') {
        // Salva a descrição da tarefa
        await saveTaskDescription(userId, userInput);
        await promptTaskDate(userId);
        return;
    }

    if (state === 'awaiting_date') {
        // Salva a data da tarefa
        await saveTaskDate(userId, userInput);
        return;
    }

    if (state === 'waiting_for_task') {
        // Apresenta opções ao usuário
        if (userInput === '1') {
            await promptTaskDescription(userId);
        } else if (userInput === '2') {
            await showTasks(userId);
        } else {
            await client.sendMessage(userId, 'Escolha uma opção válida:\n1️⃣ *Salvar uma tarefa*\n2️⃣ *Ver suas tarefas*');
        }
    }
};

// Obtém o estado do usuário
const getUserState = async (userId) => {
    try {
        const result = await query('SELECT state FROM usuarios WHERE id = ?', [userId]);
        return result.length > 0 ? result[0] : { state: 'waiting_for_task' };
    } catch (err) {
        console.error('Erro ao obter estado do usuário:', err);
        return { state: 'waiting_for_task' };
    }
};

// Solicita a descrição da tarefa
const promptTaskDescription = async (userId) => {
    try {
        await client.sendMessage(userId, 'Por favor, descreva a tarefa que deseja salvar.');
        await query('UPDATE usuarios SET state = "awaiting_description" WHERE id = ?', [userId]);
    } catch (err) {
        console.error('Erro ao solicitar descrição da tarefa:', err);
    }
};

// Salva a descrição da tarefa
const saveTaskDescription = async (userId, description) => {
    try {
        await query('INSERT INTO tarefas (user_id, descricao) VALUES (?, ?)', [userId, description]);
        console.log(`Descrição da tarefa salva para ${userId}: ${description}`);
        await client.sendMessage(userId, 'A descrição da tarefa foi salva.');
        await query('UPDATE usuarios SET state = "awaiting_date" WHERE id = ?', [userId]);
    } catch (err) {
        console.error('Erro ao salvar descrição da tarefa:', err);
    }
};

// Solicita a data da tarefa
const promptTaskDate = async (userId) => {
    try {
        await client.sendMessage(userId, 'Por favor, informe a data da tarefa no formato: DD-MM-YY. EX(24 09 2025)');
    } catch (err) {
        console.error('Erro ao solicitar data da tarefa:', err);
    }
};
const saveTaskDate = async (userId, taskDate) => {
    try {
        // Converte o formato "DD MM YYYY" para "YYYY-MM-DD"
        const dateParts = taskDate.split(' '); // Divide a string em partes
        if (dateParts.length !== 3) {
            await client.sendMessage(userId, 'Formato de data inválido. Por favor, insira a data no formato: DD MM YYYY.');
            return;
        }

        const [day, month, year] = dateParts;
        
        // Verifica se a data está válida (dia, mês e ano)
        if (!isValidDate(day, month, year)) {
            await client.sendMessage(userId, 'Data inválida. Por favor, insira uma data válida no formato: DD MM YYYY.');
            return;
        }

        // Formata a data para o padrão YYYY-MM-DD
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        await query('UPDATE tarefas SET data_tarefa = ? WHERE user_id = ? AND data_tarefa IS NULL', [formattedDate, userId]);
        await query('UPDATE usuarios SET state = "finished" WHERE id = ?', [userId]);
        console.log(`Data da tarefa salva para ${userId}: ${formattedDate}`);
        await client.sendMessage(userId, `A data ${formattedDate} foi salva com sucesso!`);
    } catch (err) {
        console.error('Erro ao salvar data da tarefa:', err);
    }
};


// Função para validar se a data é válida
const isValidDate = (day, month, year) => {
    const parsedDay = parseInt(day, 10);
    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    // Verifica se os valores são numéricos e dentro dos limites válidos
    if (isNaN(parsedDay) || isNaN(parsedMonth) || isNaN(parsedYear)) {
        return false;
    }

    // Verifica se o mês é entre 1 e 12 e o dia está dentro do intervalo válido para o mês
    if (parsedMonth < 1 || parsedMonth > 12) {
        return false;
    }

    const daysInMonth = new Date(parsedYear, parsedMonth, 0).getDate();
    if (parsedDay < 1 || parsedDay > daysInMonth) {
        return false;
    }

    // Verifica se o ano é válido (ex: >= 1900)
    if (parsedYear < 1900) {
        return false;
    }

    return true;
};
// Exibe as tarefas do usuário
const showTasks = async (userId) => {
    try {
        const tasks = await query('SELECT descricao, data_tarefa FROM tarefas WHERE user_id = ?', [userId]);
        if (tasks.length === 0) {
            await client.sendMessage(userId, 'Você não possui tarefas registradas.');
            return;
        }

        let message = 'Suas tarefas registradas 📝 :\n';
        tasks.forEach(task => {
            const date = task.data_tarefa ? formatDate(task.data_tarefa) : 'Sem data definida';
            message += `-  ${task.descricao} \n Data 📅:   (${date})\n`;
        });

        await client.sendMessage(userId, message);
    } catch (err) {
        console.error('Erro ao exibir tarefas:', err);
        await client.sendMessage(userId, 'Não foi possível buscar suas tarefas.');
    }
};

// Função para formatar a data para o padrão brasileiro (DD/MM/YYYY)
const formatDate = (date) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const formattedDate = new Date(date).toLocaleDateString('pt-BR', options);
    return formattedDate;
};

module.exports = { client };
