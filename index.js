const { create } = require('@wppconnect-team/wppconnect');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

let client;

app.get('/', (req, res) => {
  res.send('🤖 Bot WhatsApp Financeiro Online!');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

console.log('🔧 Configurando WhatsApp...');

// Configuração especial para Render
const puppeteerConfig = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor'
  ],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/opt/render/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome'
};

create({
  session: 'financeiro',
  catchQR: (base64Qr, asciiQR) => {
    console.log('📱 QR CODE - ESCANEIE COM WHATSAPP:');
    console.log('='.repeat(50));
    console.log(asciiQR);
    console.log('='.repeat(50));
    console.log('📱 Use a câmera do WhatsApp para escanear o código acima');
  },
  statusFind: (statusSession) => {
    console.log('📊 Status da sessão:', statusSession);
    if (statusSession === 'qrReadSuccess') {
      console.log('✅ WhatsApp conectado com sucesso!');
    }
    if (statusSession === 'authenticated') {
      console.log('🔐 WhatsApp autenticado!');
    }
  },
  puppeteerOptions: puppeteerConfig,
  headless: true,
  devtools: false,
  useChrome: true,
  debug: false,
  logQR: true
})
.then((clientInstance) => {
  client = clientInstance;
  console.log('✅ Cliente WhatsApp criado!');
  start(client);
})
.catch((error) => {
  console.error('❌ Erro ao inicializar WhatsApp:', error);
  console.log('🔄 Tentando novamente em 30 segundos...');
  setTimeout(() => {
    process.exit(1); // Render vai reiniciar automaticamente
  }, 30000);
});

function start(client) {
  console.log('🎯 Bot ativo e aguardando mensagens!');
  
  client.onMessage(async (message) => {
    if (!message.isGroupMsg) {
      const msg = message.body.toLowerCase().trim();
      const from = message.from;
      
      console.log(`📩 Mensagem recebida: "${msg}" de ${from}`);
      
      try {
        if (msg === '/resumo' || msg === 'resumo') {
          const resumo = `📊 *RESUMO FINANCEIRO*

✅ Pagos: 2
⏳ Pendentes: 0
❌ Vencidos: 0
📋 Total: 2

📈 *PERCENTUAIS:*
✅ 100% Pagos
⏳ 0% Pendentes
❌ 0% Vencidos

_Atualizado: ${new Date().toLocaleString('pt-BR')}_`;
          
          await client.sendText(from, resumo);
          console.log('✅ Resumo enviado!');
        }
        
        else if (msg === '/status' || msg === 'status') {
          const status = `📋 *STATUS DETALHADO*

✅ Conta de Luz - R$ 150,00
📅 Vencimento: 15/01/2025

✅ Internet - R$ 100,00
📅 Vencimento: 20/01/2025

💰 *Total: R$ 250,00*`;
          
          await client.sendText(from, status);
          console.log('✅ Status enviado!');
        }
        
        else if (msg === '/vencimentos' || msg === 'vencimentos') {
          const vencimentos = `📅 *
