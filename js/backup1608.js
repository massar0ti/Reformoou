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
app.post('/login_cliente', async (req, res) => {
  const { documento, senha } = req.body;

  if (!documento || !senha) {
    return res.status(400).json({ status: 'error', message: 'Documento e senha são necessários' });
  }

  const sql = 'SELECT * FROM cliente WHERE documento = ? AND tipo_cadastro = "C"';

  try {
    const [rows] = await promisePool.query(sql, [documento]);

    if (rows.length > 0) {
      const usuario = rows[0];

      if (senha === usuario.senha) { 
        res.json({ 
          status: 'success', 
          userId: usuario.id, // Certifique-se de que 'id' é o campo correto do banco de dados
          redirect: 'painel_user.html' 
        });
      } else {
        res.status(401).json({ status: 'error', message: 'Senha incorreta' });
      }
    } else {
      res.status(404).json({ status: 'error', message: 'Documento não encontrado' });
    }
  } catch (err) {
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
        // Retorna o ID do usuário junto com a resposta de sucesso
        res.json({
          status: 'success',
          redirect: 'painel_prestador.html',
          userId: usuario.id // Supondo que o campo do ID no banco de dados é 'id'
        });
      } else {
        res.status(401).json({ status: 'error', message: 'Senha incorreta' });
      }
    } else {
      res.status(404).json({ status: 'error', message: 'Documento não encontrado' });
    }
  } catch (err) {
    console.error('Erro ao processar login: ' + err.stack);
    res.status(500).json({ status: 'error', message: 'Erro ao processar login' });
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
  app.get('/usuario/:id', async (req, res) => {
    const userId = req.params.id;
  
    if (!userId) {
      return res.status(400).json({ status: 'error', message: 'ID do usuário é necessário' });
    }
  
    const sql = 'SELECT * FROM cliente WHERE id = ?';
  
    try {
      console.log(`Executando consulta SQL para o usuário com ID: ${userId}`);
      const [rows] = await promisePool.query(sql, [userId]);
      console.log(`Resultado da consulta: ${JSON.stringify(rows)}`);
  
      if (rows.length > 0) {
        const usuario = rows[0];
        res.json({
          status: 'success',
          data: usuario
        });
      } else {
        res.status(404).json({ status: 'error', message: 'Usuário não encontrado' });
      }
    } catch (err) {
      console.error('Erro ao buscar informações do usuário: ' + err.stack);
      res.status(500).json({ status: 'error', message: 'Erro ao buscar informações do usuário' });
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
app.put('/usuario/:id', async (req, res) => {
  const userId = req.params.id;
  const { nome_completo, documento, email, telefone,senha } = req.body;

  const sql = `
    UPDATE cliente 
    SET nome_completo = ?, documento = ?, email = ?, telefone = ?, senha = ? 
    WHERE id = ?`;

  try {
    const [result] = await promisePool.query(sql, [nome_completo, documento, email, telefone,senha, userId]);

    if (result.affectedRows > 0) {
      res.json({ status: 'success', message: 'Informações atualizadas com sucesso' });
    } else {
      res.status(404).json({ status: 'error', message: 'Usuário não encontrado' });
    }
  } catch (err) {
    console.error('Erro ao atualizar informações do usuário:', err.stack);
    res.status(500).json({ status: 'error', message: 'Erro ao atualizar informações do usuário' });
  }
});
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

app.get('/endereco/:id', (req, res) => {
  const userId = req.params.id;

  const sql = 'SELECT rua, numero, cep,bairro, cidade, estado FROM cliente WHERE id = ?';
  pool.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar endereço:', err);
      res.status(500).json({ status: 'error', message: 'Erro ao buscar endereço' });
      return;
    }

    if (result.length > 0) {
      res.json({ status: 'success', data: result[0] });
    } else {
      res.status(404).json({ status: 'error', message: 'Endereço não encontrado' });
    }
  });
});

app.put('/endereco/:id', (req, res) => {
  const userId = req.params.id;
  const { rua, numero, cep,bairro, cidade, estado } = req.body;

  const sql = `
    UPDATE cliente 
    SET rua = ?, numero = ?, cep = ?,bairro= ?, cidade = ?, estado = ? 
    WHERE id = ?
  `;

  pool.query(sql, [rua, numero, cep,bairro, cidade, estado, userId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar o endereço:', err);
      res.status(500).json({ status: 'error', message: 'Erro ao atualizar o endereço' });
      return;
    }

    if (result.affectedRows > 0) {
      res.json({ status: 'success', message: 'Endereço atualizado com sucesso' });
    } else {
      res.status(404).json({ status: 'error', message: 'Usuário não encontrado' });
    }
  });
});