const { query } = require('../config/db');
const { client } = require('./whatsappBot');

const saveTask = async (userId, taskDescription, taskDate) => {
    const insertQuery = `
        INSERT INTO clientes (id, tarefa, data_tarefa)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE tarefa = ?, data_tarefa = ?
    `;
    await query(insertQuery, [userId, taskDescription, taskDate, taskDescription, taskDate]);
    await client.sendMessage(userId, `Tarefa "${taskDescription}" registrada para o dia ${taskDate}.`);
};

module.exports = { saveTask };
