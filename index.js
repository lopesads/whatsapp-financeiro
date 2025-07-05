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

// Caminho correto do Chrome no Render
const chromePath = '/opt/render/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome';

const puppeteerConfig = {
  headless: true,
  executablePath: chromePath,
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
    '--disable-features=VizDisplayCompositor',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-images',
    '--disable-javascript',
    '--disable-default-apps',
    '--disable-sync'
  ]
};

console.log(`🔍 Usando Chrome em: ${chromePath}`);

create({
  session: 'financeiro',
  catchQR: (base64Qr, asciiQR) => {
    console.log('📱 QR CODE - ESCANEIE COM WHATSAPP:');
    console.log('='.repeat(60));
    console.log(asciiQR);
    console.log('='.repeat(60));
    console.log('📱 Abra WhatsApp → Aparelhos conectados → Conectar aparelho');
    console.log('📱 Escaneie o código QR acima');
    console.log('='.repeat(60));
  },
  statusFind: (statusSession) => {
    console.log('📊 Status da sessão:', statusSession);
    if (statusSession === 'qrReadSuccess') {
      console.log('✅ QR Code escaneado com sucesso!');
    }
    if (statusSession === 'authenticated') {
      console.log('🔐 WhatsApp autenticado!');
    }
    if (statusSession === 'inChat') {
      console.log('💬 WhatsApp conectado e pronto para receber mensagens!');
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
  console.log('✅ Cliente WhatsApp criado com sucesso!');
  console.log('🎯 Bot está ativo e funcionando!');
  start(client);
})
.catch((error) => {
  console.error('❌ Erro ao inicializar WhatsApp:', error);
  console.log('🔄 Tentando novamente em 30 segundos...');
  setTimeout(() => {
    process.exit(1);
  }, 30000);
});

function start(client) {
  console.log('🎯 Bot ativo e aguardando mensagens!');
  console.log('📱 Envie uma mensagem para o número conectado para testar');
  
  client.onMessage(async (message) => {
    if (!message.isGroupMsg) {
      const
