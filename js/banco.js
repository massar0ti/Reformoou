const mysql = require('mysql2');

// Criar a conexão
const connection = mysql.createConnection({
  host: '154.56.48.154',  // ou o endereço do seu servidor MySQL
  user: 'u356567611_gsantoscavalca',
  password: '@Biel123456',
  database: 'u356567611_reformoou'
});

// Conectar ao banco de dados
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados: ', err.stack);
    return;
  }
  console.log('Conectado ao banco de dados MySQL como id ' + connection.threadId);
});

// Realizar consultas
connection.query('SELECT * FROM cliente', (err, results, fields) => {
  if (err) {
    console.error('Erro na consulta: ', err.stack);
    return;
  }
  console.log(results);
});

// Fechar a conexão
connection.end();
