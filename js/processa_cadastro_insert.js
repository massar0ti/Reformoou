const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Configurar o body-parser para lidar com dados de formulário
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar o pool de conexões
const pool = mysql.createPool({
  host: '154.56.48.154',
  user: 'u356567611_gsantoscavalca',
  password: '@Biel123456',
  database: 'u356567611_reformoou',
  connectionLimit: 10  // Define o número máximo de conexões no pool
});

// Promisificar a pool para usar async/await
const promisePool = pool.promise();

// Rota para processar o formulário
app.post('/processa_cadastro', async (req, res) => {
  const { nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha } = req.body;

  const sql = 'INSERT INTO cliente (nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  try {
    const [result] = await promisePool.query(sql, [nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha]);
    res.send('Cadastro realizado com sucesso!');
  } catch (err) {
    console.error('Erro ao cadastrar: ' + err.stack);
    res.send('Erro ao cadastrar: ' + err.message);
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
