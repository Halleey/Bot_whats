const { checkIfUserExists, saveNewUser, getUserState, updateUserState } = require('./userService');
const { saveTaskDescription, saveTaskDate, showTasks } = require('./taskService');

const handleIncomingMessage = async (client, msg) => {
    const userId = msg.from;
    const userInput = msg.body.trim();

    // Ignora mensagens enviadas pelo próprio bot
    if (userId === client.info.wid._serialized) return;

    const userExists = await checkIfUserExists(userId);
    if (!userExists) {
        await saveNewUser(userId);
        await client.sendMessage(userId, `Olá, sou o Zard Bot! O que deseja fazer?\n1️⃣ Salvar uma tarefa\n2️⃣ Ver suas tarefas`);
        return;
    }

    const { state } = await getUserState(userId);
    switch (state) {
        case 'finished':
            await client.sendMessage(userId, `Olá, sou o Zard Bot! O que deseja fazer?\n1️⃣ Salvar uma tarefa\n2️⃣ Ver suas tarefas`);
            await updateUserState(userId, 'waiting_for_task'); // Altera o estado para "waiting_for_task"
            break;

        case 'waiting_for_task':
            await handleTaskSelection(client, userId, userInput);
            break;

        case 'awaiting_description':
            await saveTaskDescription(client, userId, userInput);
            break;

        case 'awaiting_date':
            await saveTaskDate(client, userId, userInput);
            break;

        default:
            await client.sendMessage(userId, 'Algo deu errado. Tente novamente.');
    }
};

const handleTaskSelection = async (client, userId, userInput) => {
    if (userInput === '1') {
        await client.sendMessage(userId, 'Por favor, descreva a tarefa que deseja salvar.');
        await updateUserState(userId, 'awaiting_description');
    } else if (userInput === '2') {
        await showTasks(client, userId);
    } else {
        await client.sendMessage(userId, 'Escolha uma opção válida:\n1️⃣ Salvar uma tarefa\n2️⃣ Ver suas tarefas');
    }
};

module.exports = { handleIncomingMessage };
