const { query } = require('../config/db');

const checkIfUserExists = async (userId) => {
    const result = await query('SELECT id FROM usuarios WHERE id = ?', [userId]);
    return result.length > 0;
};

const saveNewUser = async (userId) => {
    await query('INSERT INTO usuarios (id, nome, state) VALUES (?, ?, ?)', [userId, 'amigo(a)', 'waiting_for_task']);
};

const getUserState = async (userId) => {
    const result = await query('SELECT state FROM usuarios WHERE id = ?', [userId]);
    return result.length > 0 ? result[0] : { state: 'waiting_for_task' };
};

const updateUserState = async (userId, state) => {
    await query('UPDATE usuarios SET state = ? WHERE id = ?', [state, userId]);
};

module.exports = { checkIfUserExists, saveNewUser, getUserState, updateUserState };
