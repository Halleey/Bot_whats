const mysql = require('mysql2');

// Configuração da conexão com o banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zard',
    database: 'zard_bot'
});

// Conexão com o banco de dados
db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados MySQL');
    }
});

// Função para criar as tabelas no banco de dados
const createTable = () => {
    const userTableQuery = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id VARCHAR(255) PRIMARY KEY,
            nome VARCHAR(255),
            state VARCHAR(255)
        );
    `;
    const taskTableQuery = `
        CREATE TABLE IF NOT EXISTS tarefas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255),
            descricao VARCHAR(255),
            data_tarefa DATE,
            FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
    `;

    db.query(userTableQuery, err => {
        if (err) {
            console.error('Erro ao criar a tabela de usuários:', err.message);
        } else {
            console.log('Tabela de usuários criada ou já existente.');
        }
    });

    db.query(taskTableQuery, err => {
        if (err) {
            console.error('Erro ao criar a tabela de tarefas:', err.message);
        } else {
            console.log('Tabela de tarefas criada ou já existente.');
        }
    });
};

// Função genérica para consultas ao banco
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Exporta as funções e a conexão
module.exports = { db, createTable, query };
