const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Configurar o middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Configurar arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configurar o pool de conexões
const pool = mysql.createPool({
  host: '193.203.175.126',
  user: 'u565643099_gsantoscavalc',
  password: '@Biel123456', 
  database: 'u565643099_reformoou',
  connectionLimit: 10
});
const promisePool = pool.promise();

// Rota para processar o formulário de cadastro
app.post('/processa_cadastro', async (req, res) => {
  const { tipo_cadastro, nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha } = req.body;

  // Log dos dados recebidos
  console.log(req.body);

  // Verificação dos campos obrigatórios
  const camposObrigatorios = {nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha };
  for (const campo in camposObrigatorios) {
    if (!camposObrigatorios[campo]) {
      return res.status(400).send(`Campo ${campo} é obrigatório.`);
    }
  }

  try {

    const sql = 'INSERT INTO cliente (tipo_cadastro,nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await promisePool.query(sql, [tipo_cadastro,nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha]);
    
    res.redirect('/confirmacao.html');
  } catch (err) {
    console.error('Erro ao cadastrar: ' + err.stack);
    res.status(500).send('Erro ao cadastrar.');
  }
});

// Rota para processar o login
app.post('/login', async (req, res) => {
  const { documento, senha } = req.body;

  if (!documento || !senha) {
    return res.status(400).send('Documento e senha são necessários');
  }

  const sql = 'SELECT * FROM cliente WHERE documento = ? AND tipo_cadastro = "C"';

  try {
    const [rows] = await promisePool.query(sql, [documento]);

    if (rows.length > 0) {
      const usuario = rows[0];

      if (senha === usuario.senha) { 
        res.json({ status: 'success', redirect: 'painel_user.html' });
      } else {
        res.status(401).json({ status: 'error', message: 'Senha incorreta' });
      }
    } else {
      // Se o documento não for encontrado, retorna um erro
      res.status(404).json({ status: 'error', message: 'Documento não encontrado' });
    }
  } catch (err) {
    // Captura qualquer erro que ocorrer durante o processo de login
    console.error('Erro ao processar login: ' + err.stack);
    res.status(500).json({ status: 'error', message: 'Erro ao processar login' });
  }
});

app.post('/login_prestador', async (req, res) => {
  const { documento, senha } = req.body;

  if (!documento || !senha) {
    return res.status(400).send('Documento e senha são necessários');
  }

  const sql = 'SELECT * FROM cliente WHERE documento = ? AND tipo_cadastro = "P"';

  try {
    const [rows] = await promisePool.query(sql, [documento]);

    if (rows.length > 0) {
      const usuario = rows[0];

      if (senha === usuario.senha) { 
        res.json({ status: 'success', redirect: 'painel_prestador.html' });
      } else {
        res.status(401).json({ status: 'error', message: 'Senha incorreta' });
      }
    } else {
      // Se o documento não for encontrado, retorna um erro
      res.status(404).json({ status: 'error', message: 'Documento não encontrado' });
    }
  } catch (err) {
    // Captura qualquer erro que ocorrer durante o processo de login
    console.error('Erro ao processar login: ' + err.stack);
    res.status(500).json({ status: 'error', message: 'Erro ao processar login' });
  }
});


// Rota para obter todos os usuários
app.post('/obter_usuario', async (req, res) => {
    const { id } = req.body;
    const sql = 'SELECT * FROM cliente WHERE id = ?';
  
    try {
      const [rows] = await promisePool.query(sql, [id]);
      if (rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.status(404).send('Usuário não encontrado');
      }
    } catch (err) {
      console.error('Erro ao obter usuário:', err);
      res.status(500).send('Erro ao obter usuário');
    }
  });
  app.get('/usuarios', async (req, res) => {
    const sql = 'SELECT * FROM cliente';
  
    try {
      const [rows] = await promisePool.query(sql);
      console.log('Usuários encontrados:', rows); // Adicione um log para depuração
      res.json(rows);
    } catch (err) {
      console.error('Erro ao obter usuários:', err);
      res.status(500).send('Erro ao obter usuários');
    }
  });
  
  // Rota para excluir um usuário
  app.post('/excluir_usuario', async (req, res) => {
    const { id } = req.body;
    const sql = 'DELETE FROM cliente WHERE id = ?';
  
    try {
      await promisePool.query(sql, [id]);
      res.send('Usuário excluído com sucesso');
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      res.status(500).send('Erro ao excluir usuário');
    }
  });
  
  // Rota para atualizar um usuário
  app.post('/atualizar_usuario', async (req, res) => {
    const { id, tipo_cadastro,nome_completo, email, documento, rua, numero, cep } = req.body;
    const sql = 'UPDATE cliente SET tipo_cadastro = ?, nome_completo = ?, email = ?, documento = ?, rua = ?, numero = ?, cep = ? WHERE id = ?';
  
    try {
      await promisePool.query(sql, [tipo_cadastro,nome_completo, email, documento, rua, numero, cep, id]);
      res.send('Usuário atualizado com sucesso');
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      res.status(500).send('Erro ao atualizar usuário');
    }
  });
// Iniciar o servidor
const PORT = process.env.port || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
