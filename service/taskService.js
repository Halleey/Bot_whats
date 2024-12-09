const { query } = require('../config/db');

const saveTaskDescription = async (client, userId, description) => {
    await query('INSERT INTO tarefas (user_id, descricao) VALUES (?, ?)', [userId, description]);
    await client.sendMessage(userId, 'A descrição da tarefa foi salva. Informe a data no formato DD MM YYYY.');
    await query('UPDATE usuarios SET state = "awaiting_date" WHERE id = ?', [userId]);
};


const saveTaskDate = async (client, userId, taskDate) => {
    try {
        const [day, month, year] = taskDate.split(' ');
        if (!isValidDate(day, month, year)) {
            await client.sendMessage(userId, 'Data inválida. Por favor, insira uma data válida.');
            return;
        }

        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        await query('UPDATE tarefas SET data_tarefa = ? WHERE user_id = ? AND data_tarefa IS NULL', [formattedDate, userId]);
        await query('UPDATE usuarios SET state = "finished" WHERE id = ?', [userId]);
        await client.sendMessage(userId, `A data ${formattedDate} foi salva com sucesso!`);
    } catch (err) {
        console.error('Erro ao salvar data da tarefa:', err);
        await client.sendMessage(userId, 'Ocorreu um erro ao salvar a data da tarefa.');
    }
};


const showTasks = async (client, userId) => {
    const tasks = await query('SELECT descricao, data_tarefa FROM tarefas WHERE user_id = ?', [userId]);
    if (tasks.length === 0) {
        await client.sendMessage(userId, 'Você não possui tarefas registradas.');
        return;
    }

    let message = 'Suas tarefas registradas 📝:\n';
    tasks.forEach(task => {
        const date = task.data_tarefa ? formatDate(task.data_tarefa) : 'Sem data definida';
        message += `- ${task.descricao} (📅 ${date})\n`;
    });
    await client.sendMessage(userId, message);
};

const isValidDate = (day, month, year) => {
    const date = new Date(`${year}-${month}-${day}`);
    return !isNaN(date);
};

const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR');

module.exports = { saveTaskDescription, saveTaskDate, showTasks };
