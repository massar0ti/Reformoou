function validarSenha(senha) {
  const minCaracteres = document.getElementById('minimo-caracteres');
  const caracterEspecial = document.getElementById('caracter-especial');
  const caracterMaiusculo = document.getElementById('caracter-maiusculo');
  const caracterNumero = document.getElementById('caracter-numero');

  // Verificação do mínimo de caracteres
  const senhaValida = senha.value.length >= 8;
  minCaracteres.classList.toggle('invalid', !senhaValida);
  minCaracteres.classList.toggle('valid', senhaValida);

  // Verificação de caractere especial
  const senhaTemEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha.value);
  caracterEspecial.classList.toggle('invalid', !senhaTemEspecial);
  caracterEspecial.classList.toggle('valid', senhaTemEspecial);

  // Verificação de caractere maiúsculo
  const senhaTemMaiusculo = /[A-Z]/.test(senha.value);
  caracterMaiusculo.classList.toggle('invalid', !senhaTemMaiusculo);
  caracterMaiusculo.classList.toggle('valid', senhaTemMaiusculo);

  // Verificação de número
  const senhaTemNumero = /[0-9]/.test(senha.value);
  caracterNumero.classList.toggle('invalid', !senhaTemNumero);
  caracterNumero.classList.toggle('valid', senhaTemNumero);

  // A senha é válida se atender a todos os critérios
  return senhaValida && senhaTemEspecial && senhaTemMaiusculo && senhaTemNumero;
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('senha');
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;

  const eyeImage = document.getElementById('eye-image');
  // Alterar o ícone do olho
  if (type === 'password') {
      eyeImage.src = 'imagens/olho.png'; // Caminho para a imagem de olho aberto
      eyeImage.alt = 'Mostrar Senha';
  } else {
      eyeImage.src = 'imagens/fechar-o-olho.png'; // Caminho para a imagem de olho fechado
      eyeImage.alt = 'Ocultar Senha';
  }
}
