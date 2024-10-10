const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Configurar o middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/painel_user', verificarSessao);
app.use('/painel_prestador', verificarSessao);

// Configurar arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configurar o pool de conexões
const pool = mysql.createPool({
  host: '193.203.175.126',
  user: 'u565643099_gsantoscavalc',
  password: '@Biel123456',
  database: 'u565643099_reformoou',
  connectionLimit: 20
});
const promisePool = pool.promise();

// Rota para processar o formulário de cadastro
app.post('/processa_cadastro', async (req, res) => {
  const { tipo_cadastro, nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha } = req.body;

  // Log dos dados recebidos
  console.log(req.body);

  // Verificação dos campos obrigatórios
  const camposObrigatorios = { nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha };
  for (const campo in camposObrigatorios) {
    if (!camposObrigatorios[campo]) {
      return res.status(400).send(`Campo ${campo} é obrigatório.`);
    }
  }

  try {

    const sql = 'INSERT INTO cliente (tipo_cadastro,nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await promisePool.query(sql, [tipo_cadastro, nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha]);

    res.redirect('/confirmacao.html');
  } catch (err) {
    console.error('Erro ao cadastrar: ' + err.stack);
    res.status(500).send('Erro ao cadastrar.');
  }
});

app.post('/processa_cadastro_prestador', async (req, res) => {
  const { tipo_cadastro, nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha } = req.body;

  // Log dos dados recebidos
  console.log(req.body);

  // Verificação dos campos obrigatórios
  const camposObrigatorios = { nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha };
  for (const campo in camposObrigatorios) {
    if (!camposObrigatorios[campo]) {
      return res.status(400).send(`Campo ${campo} é obrigatório.`);
    }
  }

  try {

    const sql = 'INSERT INTO prestador (tipo_cadastro,nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await promisePool.query(sql, [tipo_cadastro, nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha]);

    res.redirect('/confirmacao.html');
  } catch (err) {
    console.error('Erro ao cadastrar: ' + err.stack);
    res.status(500).send('Erro ao cadastrar.');
  }
});


app.post('/processa_cadastro_reforma', async (req, res) => {
  const { tipo_cadastro, nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha } = req.body;

  // Log dos dados recebidos
  console.log(req.body);

  // Verificação dos campos obrigatórios
  const camposObrigatorios = { nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha };
  for (const campo in camposObrigatorios) {
    if (!camposObrigatorios[campo]) {
      return res.status(400).send(`Campo ${campo} é obrigatório.`);
    }
  }

  try {
    const sql = 'INSERT INTO cliente (tipo_cadastro, nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await promisePool.query(sql, [tipo_cadastro, nome_completo, telefone, email, documento, cep, rua, numero, bairro, cidade, estado, senha]);

    // Pega o ID do cliente recém-cadastrado
    const userId = result.insertId;

    // Armazena o userId no cookie
    res.cookie('userId', userId, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // Cookie válido por 24 horas

    // Redireciona para a página de solicitação de reforma após o cadastro
    res.redirect('/solicita_reforma.html');
  } catch (err) {
    console.error('Erro ao cadastrar: ' + err.stack);
    res.status(500).send('Erro ao cadastrar.');
  }
});


app.get('/verificar-cpf', async (req, res) => {
  const cpf = req.query.cpf;

  if (!cpf) {
    return res.status(400).json({ status: 'error', message: 'CPF é necessário' });
  }

  try {
    const [results] = await promisePool.query('SELECT id FROM cliente WHERE documento = ?', [cpf]);

    if (results.length > 0) {
      const userId = results[0].id;
      res.json({ cadastrado: true, id: userId });
    } else {
      res.json({ cadastrado: false });
    }
  } catch (error) {
    console.error('Erro na consulta ao banco de dados:', error);
    res.status(500).send('Erro no servidor');
  }
});


app.post('/login_cliente', async (req, res) => {
  const { documento, senha } = req.body;

  if (!documento || !senha) {
    return res.status(400).json({ status: 'error', message: 'Documento e senha são necessários' });
  }

  const sql = 'SELECT * FROM cliente WHERE documento = ? AND tipo_cadastro in ("CF","CJ")';

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

app.get('/get-servico/:id', async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ status: 'error', message: 'ID do usuário é necessário' });
  }

  const sql = 'SELECT * FROM solicita_reforma WHERE id_cliente = ?';

  try {
    console.log(`Executando consulta SQL para o serviço com userId: ${userId}`);
    const [rows] = await promisePool.query(sql, [userId]);
    console.log(`Resultado da consulta: ${JSON.stringify(rows)}`);

    if (rows.length > 0) {
      const reforma = rows[0];
      res.json({
        status: 'success',
        data: reforma
      });
    } else {
      res.status(404).json({ status: 'error', message: 'Serviço não encontrado' });
    }
  } catch (err) {
    console.error('Erro ao buscar informações do serviço: ' + err.stack);
    res.status(500).json({ status: 'error', message: 'Erro ao buscar informações do serviço' });
  }
});

app.get('/orcamento/:id', async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ status: 'error', message: 'ID do usuário é necessário' });
  }

  const sql = 'SELECT id_prestador,nome_completo,valor,dt_envio FROM orcamento as orc inner join cliente as cli on orc.id_cliente=cli.id WHERE id_cliente = ?';
  
  try {
    console.log(`Executando consulta SQL para o serviço com userId: ${userId}`);
    const [rows] = await promisePool.query(sql, [userId]);
    console.log(`Resultado da consulta: ${JSON.stringify(rows)}`);

    if (rows.length > 0) {
      const reforma = rows[0];
      res.json({
        status: 'success',
        data: reforma
      });
    } else {
      res.status(404).json({ status: 'error', message: 'Serviço não encontrado' });
    }
  } catch (err) {
    console.error('Erro ao buscar informações do serviço: ' + err.stack);
    res.status(500).json({ status: 'error', message: 'Erro ao buscar informações do serviço' });
  }
});

app.post('/solicitar-reforma', (req, res) => {
  const {
    tipo_reforma, ambiente, ambiente_extra, area_reforma,
    necessidade_obra, atividade_salao, descricao, descricao_reforma,
    data_inicio, data_termino, cep, rua, numero, bairro, cidade, estado,
    userId
  } = req.body;

  console.log('UserId recebido para solicitar reforma:', userId); // Verifique o valor de userId

  if (!userId) {
    return res.status(400).send('Usuário não autenticado.');
  }

  // Inserir os dados no banco de dados, incluindo o userId
  const sql = `
      INSERT INTO solicita_reforma (id_cliente, tipo_reforma, ambiente, ambiente_extra, area_reforma,
      necessidade_obra, atividade_salao, descricao, descricao_reforma,
      data_inicio, data_termino, cep, rua, numero, bairro, cidade, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(sql, [
    userId, tipo_reforma, ambiente, ambiente_extra, area_reforma,
    necessidade_obra, atividade_salao, descricao, descricao_reforma,
    data_inicio, data_termino, cep, rua, numero, bairro, cidade, estado
  ], (err, result) => {
    if (err) {
      console.error('Erro ao inserir os dados:', err); // Verifique o erro
      res.status(500).send('Erro ao solicitar reforma.');
    } else {
      res.send('Reforma solicitada com sucesso.');
    }
  });
});




app.get('/check-session', (req, res) => {
  const userId = req.cookies.userId;
  const tipoUsuario = req.cookies.tipoUsuario;

  if (userId && tipoUsuario) {
    const redirectUrl = tipoUsuario === 'cliente' ? '/painel_user.html' : '/painel_prestador.html';
    return res.json({ loggedIn: true, redirect: redirectUrl });
  }

  return res.json({ loggedIn: false });
});
app.get('/check-session-prestador', (req, res) => {
  const userId = req.cookies.userId;
  const tipoUsuario = req.cookies.tipoUsuario;

  if (userId && tipoUsuario === 'prestador') {
    // Verifica o tipo de cadastro do prestador
    pool.query('SELECT tipo_cadastro FROM cliente WHERE id = ?', [userId], (error, results) => {
      if (error) {
        console.error('Erro ao verificar sessão:', error);
        return res.status(500).json({ status: 'error', message: 'Erro ao verificar sessão' });
      }

      if (results.length > 0) {
        const tipoCadastro = results[0].tipo_cadastro;

        if (tipoCadastro === 'PJ' || tipoCadastro === 'PF') {
          return res.json({ loggedIn: true, redirect: '/painel_prestador.html' });
        }
      }

      // Caso o tipo de cadastro não seja adequado
      return res.json({ loggedIn: false });
    });
  } else {
    return res.json({ loggedIn: false });
  }
});

app.get('/painel_user.html', (req, res) => {
  const userId = req.cookies.userId;
  const tipoUsuario = req.cookies.tipoUsuario;

  if (!userId || tipoUsuario !== 'cliente') {
    return res.redirect('/login.html');  // Redireciona para o login se o usuário não for um cliente autenticado
  }

  res.sendFile(path.join(__dirname, 'public', 'painel_user.html'));
});

app.get('/painel_prestador.html', (req, res) => {
  const userId = req.cookies.userId;
  const tipoUsuario = req.cookies.tipoUsuario;

  if (!userId || tipoUsuario !== 'prestador') {
    // Redireciona para o login de prestador se o usuário não for um prestador autenticado
    return res.redirect('/login_prestador.html');
  }

  // Se for um prestador autenticado, serve o arquivo HTML
  res.sendFile(path.join(__dirname, 'public', 'painel_prestador.html'));
});


// Login para prestadores
app.post('/login_prestador', async (req, res) => {
  const { documento, senha } = req.body;

  if (!documento || !senha) {
    return res.status(400).json({ status: 'error', message: 'Documento e senha são necessários' });
  }

  const sql = 'SELECT * FROM prestador WHERE documento = ?';

  try {
    const [rows] = await promisePool.query(sql, [documento]);

    if (rows.length > 0) {
      const usuario = rows[0];

      if (senha === usuario.senha) {
        res.json({
          status: 'success',
          userId: usuario.id, // Certifique-se de que 'id' é o campo correto do banco de dados
          redirect: 'painel_prestador.html'
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

app.use((req, res, next) => {
  const tipoUsuario = req.cookies.tipoUsuario;
  const userId = req.cookies.userId;

  if (!userId) {
    return next(); // Continua para a próxima rota se não estiver autenticado
  }

  if (req.path === '/painel_cliente.html' && tipoUsuario === 'cliente') {
    return res.redirect('/painel_user.html');
  }

  if (req.path === '/painel_prestador.html' && tipoUsuario === 'prestador') {
    return res.redirect('/painel_prestador.html');
  }

  next();
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
app.get('/validateUserType/:userId', async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ status: 'error', message: 'ID do usuário é necessário' });
  }

  const sql = 'SELECT tipo_cadastro FROM cliente WHERE id = ?';

  try {
    console.log(`Executando consulta SQL para o usuário com ID: ${userId}`);
    const [rows] = await promisePool.query(sql, [userId]);
    console.log(`Resultado da consulta: ${JSON.stringify(rows)}`);

    if (rows.length > 0) {
      const tipoCadastro = rows[0].tipo_cadastro;
      if (['CF', 'CJ'].includes(tipoCadastro)) {
        // Cliente
        res.json({ status: 'success', redirectUrl: 'painel_user.html' });
      } else if (['PJ', 'PF'].includes(tipoCadastro)) {
        // Prestador
        res.json({ status: 'success', redirectUrl: 'painel_prestador.html' });
      } else {
        // Tipo de cadastro desconhecido
        res.status(400).json({ status: 'error', message: 'Tipo de cadastro desconhecido' });
      }
    } else {
      res.status(404).json({ status: 'error', message: 'Usuário não encontrado' });
    }
  } catch (err) {
    console.error('Erro ao buscar informações do usuário: ' + err.stack);
    res.status(500).json({ status: 'error', message: 'Erro ao buscar informações do usuário' });
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
app.get('/usuario_prestador/:id', async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ status: 'error', message: 'ID do usuário é necessário' });
  }

  const sql = 'SELECT * FROM prestador WHERE id = ?';

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
app.put('/usuario_prestador/:id', async (req, res) => {
  const userId = req.params.id;
  const { nome_completo, documento, email, telefone, senha } = req.body;

  const sql = `
      UPDATE prestador 
      SET nome_completo = ?, documento = ?, email = ?, telefone = ?, senha = ? 
      WHERE id = ?`;

  try {
    const [result] = await promisePool.query(sql, [nome_completo, documento, email, telefone, senha, userId]);

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

app.get('/endereco_prestador/:id', (req, res) => {
  const userId = req.params.id;

  const sql = 'SELECT rua, numero, cep,bairro, cidade, estado FROM prestador WHERE id = ?';
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

app.put('/endereco_prestador/:id', (req, res) => {
  const userId = req.params.id;
  const { rua, numero, cep, bairro, cidade, estado } = req.body;

  const sql = `
      UPDATE prestador 
      SET rua = ?, numero = ?, cep = ?,bairro= ?, cidade = ?, estado = ? 
      WHERE id = ?
    `;

  pool.query(sql, [rua, numero, cep, bairro, cidade, estado, userId], (err, result) => {
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


// Rota para atualizar um usuário
app.post('/atualizar_usuario', async (req, res) => {
  const { id, tipo_cadastro, nome_completo, email, documento, rua, numero, cep } = req.body;
  const sql = 'UPDATE cliente SET tipo_cadastro = ?, nome_completo = ?, email = ?, documento = ?, rua = ?, numero = ?, cep = ? WHERE id = ?';

  try {
    await promisePool.query(sql, [tipo_cadastro, nome_completo, email, documento, rua, numero, cep, id]);
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
  const { nome_completo, documento, email, telefone, senha } = req.body;

  const sql = `
    UPDATE cliente 
    SET nome_completo = ?, documento = ?, email = ?, telefone = ?, senha = ? 
    WHERE id = ?`;

  try {
    const [result] = await promisePool.query(sql, [nome_completo, documento, email, telefone, senha, userId]);

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
  const { rua, numero, cep, bairro, cidade, estado } = req.body;

  const sql = `
    UPDATE cliente 
    SET rua = ?, numero = ?, cep = ?,bairro= ?, cidade = ?, estado = ? 
    WHERE id = ?
  `;

  pool.query(sql, [rua, numero, cep, bairro, cidade, estado, userId], (err, result) => {
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

app.get('/get-servico/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const [rows] = await db.query('SELECT * FROM reformas WHERE userId = ?', [userId]);

    if (rows.length > 0) {
      res.json({ status: 'success', data: rows[0] });
    } else {
      res.json({ status: 'error', message: 'Serviço não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar informações da reforma:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao buscar informações da reforma' });
  }
});

// Rota para atualizar as informações da reforma
app.get('/get-servico/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM servicos WHERE user_id = ?', [userId]);
    connection.release();
    
    if (rows.length > 0) {
      res.json({ status: 'success', data: rows[0] });
    } else {
      res.json({ status: 'error', message: 'Serviço não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Erro no servidor', error });
  }
});

// Endpoint para atualizar dados da reforma
app.put('/update-servico/:id_solicita', async (req, res) => {
  // Extraindo o parâmetro id_solicita da URL
  const { id_solicita } = req.params;
  const { tipo_reforma, ambiente, ambiente_extra, necessidade_obra, descricao, data_inicio, data_termino, cep, rua, numero, bairro, cidade, estado } = req.body;

  // SQL para atualizar a solicitação de reforma
  const sql = `
    UPDATE solicita_reforma
    SET
      tipo_reforma = ?,
      ambiente = ?,
      ambiente_extra = ?,
      necessidade_obra = ?,
      descricao = ?,
      data_inicio = ?,
      data_termino = ?,
      cep = ?,
      rua = ?,
      numero = ?,
      bairro = ?,
      cidade = ?,
      estado = ?
    WHERE id_solicita = ?;
  `;

  // Executando a consulta SQL
  pool.query(sql, [tipo_reforma, ambiente, ambiente_extra, necessidade_obra, descricao, data_inicio, data_termino, cep, rua, numero, bairro, cidade, estado, id_solicita], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar a solicitação:', err);
      res.status(500).json({ status: 'error', message: 'Erro ao atualizar a solicitação' });
      return;
    }

    if (result.affectedRows > 0) {
      res.json({ status: 'success', message: 'Solicitação atualizada com sucesso' });
    } else {
      res.status(404).json({ status: 'error', message: 'Solicitação não encontrada' });
    }
  });
});



function verificarSessao(req, res, next) {
  const tipoUsuario = req.cookies.tipoUsuario;
  const userId = req.cookies.userId;

  if (!userId || !tipoUsuario) {
    return res.redirect('/login.html');
  }

  pool.query('SELECT tipo_cadastro FROM cliente WHERE id = ?', [userId], (error, results) => {
    if (error) {
      return next(error);
    }

    if (results.length > 0) {
      const tipoCadastro = results[0].tipo_cadastro;

      if ((req.originalUrl.includes('painel_user') && (tipoCadastro === 'CF' || tipoCadastro === 'CJ')) ||
        (req.originalUrl.includes('painel_prestador') && (tipoCadastro === 'PJ' || tipoCadastro === 'PF'))) {
        return next(); // Usuário correto para o painel
      }

      return res.redirect('/login.html');
    } else {
      return res.redirect('/login.html');
    }
  });
}



// Rota de logout
app.post('/logout', (req, res) => {
  res.clearCookie('userId');
  res.json({ status: 'success', message: 'Logout bem-sucedido' });
});
app.get('/painel_user', (req, res) => {
  const tipo_cadastro = req.cookies.tipo_cadastro;

  // Verifica se o usuário tem permissão para acessar o painel do cliente
  if (tipo_cadastro === 'cf' || tipo_cadastro === 'cj') {
    res.render('painel_user'); // Renderiza o painel do cliente
  } else {
    res.redirect('/painel_prestador'); // Redireciona para o painel do prestador
  }
});

app.get('/painel_prestador', (req, res) => {
  const tipo_cadastro = req.cookies.tipo_cadastro;

  // Verifica se o usuário tem permissão para acessar o painel do prestador
  if (tipo_cadastro === 'pj' || tipo_cadastro === 'pf') {
    res.render('painel_prestador'); // Renderiza o painel do prestador
  } else {
    res.redirect('/painel_user'); // Redireciona para o painel do cliente
  }
});
app.get('/painel_user', verificarSessao, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'painel_user.html'));
});

app.get('/painel_prestador', verificarSessao, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'painel_prestador.html'));
});

