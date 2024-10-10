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

  const sql = 'SELECT * FROM cliente WHERE documento = ? AND tipo_cadastro in ("CF","CJ")';

  try {
    const [rows] = await promisePool.query(sql, [documento]);

    if (rows.length > 0) {
      const usuario = rows[0];

      if (senha === usuario.senha) {
        // Define o cookie com o ID do usuário
        res.cookie('userId', usuario.id, {
          httpOnly: true,  // Evita que o cookie seja acessível via JavaScript no front-end
          secure: true,    // Garante que o cookie seja enviado apenas em conexões HTTPS (recomendo usar em produção)
          maxAge: 7 * 24 * 60 * 60 * 1000  // O cookie expira em 7 dias
        });

        res.json({ 
          status: 'success', 
          userId: usuario.id,  // Certifique-se de que 'id' é o campo correto do banco de dados
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

  const sql = 'SELECT * FROM cliente WHERE documento = ? AND tipo_cadastro in ("PJ", "PF")';

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
app.post('/solicitar-reforma', (req, res) => {
  const {
    tipo_reforma, ambiente, ambiente_extra, area_reforma,
    necessidade_obra, atividade_salao, descricao, descricao_reforma,
    data_inicio, data_termino, cep, rua, numero, bairro, cidade, estado
  } = req.body;

  // Recupera o ID do usuário autenticado do cookie
  const userId = req.cookies.userId;

  // Verifica se o usuário está autenticado
  if (!userId) {
    return res.status(401).send('Usuário não autenticado.');
  }

  // Inserir os dados no banco de dados, incluindo o userId
  const sql = `
      INSERT INTO solicita_reforma (user_id, tipo_reforma, ambiente, ambiente_extra, area_reforma,
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
      console.error('Erro ao inserir os dados:', err);
      res.status(500).send('Erro ao processar a solicitação.');
      return;
    }
    res.send('Solicitação de reforma enviada com sucesso!');
  });
});


async function verificarAutenticacao(req, res, next) {
  const userId = req.cookies.userId;

  if (!userId) {
    return res.redirect('/login.html'); // Redireciona se não estiver autenticado
  }

  try {
    const [rows] = await promisePool.query(
      'SELECT tipo_cadastro FROM cliente WHERE tipo_cadastro IN ("CF", "CJ") AND id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.redirect('/login.html'); // Redireciona se o usuário não for encontrado
    }

    const tipoCadastro = rows[0].tipo_cadastro;
    req.tipoCadastro = tipoCadastro; // Adiciona o tipo de cadastro ao objeto `req`
    next();
  } catch (error) {
    console.error('Erro ao verificar tipo de usuário:', error);
    res.redirect('/login.html'); // Redireciona em caso de erro
  }
}

// Função de verificação de autenticação para prestadores
async function verificarAutenticacaoprestador(req, res, next) {
  const userId = req.cookies.userId;

  if (!userId) {
    return res.redirect('/login_prestador.html'); // Redireciona para a página de login se não estiver autenticado
  }

  try {
    const [rows] = await promisePool.query('SELECT tipo_cadastro FROM prestador WHERE id = ?', [userId]);

    if (rows.length === 0 || rows[0].tipo_cadastro !== 'P') {
      return res.redirect('/login_prestador.html'); // Redireciona se o usuário não for um prestador
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar prestador:', error);
    res.redirect('/login_prestador.html'); // Redireciona em caso de erro
  }
}

// Middleware para garantir que um cliente não acesse a página do prestador
async function verificarNaoPrestador(req, res, next) {
  const userId = req.cookies.userId;

  if (!userId) {
    return next(); // Se não estiver autenticado, prossiga para a próxima verificação
  }

  try {
    const [rows] = await promisePool.query('SELECT tipo_cadastro FROM cliente WHERE id = ?', [userId]);

    if (rows.length > 0 && (rows[0].tipo_cadastro === 'CF' || rows[0].tipo_cadastro === 'CJ')) {
      return res.redirect('/painel_user.html'); // Redireciona para o painel de cliente se for um cliente
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar tipo de usuário:', error);
    next();
  }
}

// Middleware para garantir que um prestador não acesse a página do cliente
async function verificarNaoCliente(req, res, next) {
  const userId = req.cookies.userId;

  if (!userId) {
    return next(); // Se não estiver autenticado, prossiga para a próxima verificação
  }

  try {
    const [rows] = await promisePool.query('SELECT tipo_cadastro FROM prestador WHERE id = ?', [userId]);

    if (rows.length > 0 && rows[0].tipo_cadastro === 'P') {
      return res.redirect('/painel_prestador.html'); // Redireciona para o painel de prestador se for um prestador
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar tipo de prestador:', error);
    next();
  }
}

// Rota protegida - Cliente
app.get('/painel_user.html', verificarAutenticacao, verificarNaoCliente, (req, res) => {
  if (req.tipoCadastro === 'CF' || req.tipoCadastro === 'CJ') {
    res.sendFile(path.join(__dirname, 'painel_user.html')); // Corrigido o path do arquivo
  } else {
    res.redirect('/login.html'); // Redireciona se o tipo de cadastro não for apropriado
  }
});

// Rota protegida - Prestador
app.get('/painel_prestador.html', verificarAutenticacaoprestador, verificarNaoCliente, (req, res) => {
  res.sendFile(path.join(__dirname, 'painel_prestador.html')); // Corrigido o path do arquivo
});
// Rota de logout
app.post('/logout', (req, res) => {
  res.clearCookie('userId');
  res.json({ status: 'success', message: 'Logout bem-sucedido' });
});

app.get('/verificar_sessao', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    res.redirect('/login_prestador.html');
  } else {
    res.sendStatus(200);
  }
});