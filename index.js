const { create } = require('@wppconnect-team/wppconnect');
const express = require('express');
const fs = require('fs');

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

// Função para encontrar Chrome
function findChrome() {
  const possiblePaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/opt/google/chrome/chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      console.log(`✅ Chrome encontrado em: ${path}`);
      return path;
    }
  }
  
  console.log('⚠️ Chrome não encontrado, usando padrão do sistema');
  return null;
}

// Configuração dinâmica
const chromePath = findChrome();
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
    '--disable-features=VizDisplayCompositor',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ]
};

// Só definir executablePath se encontrou Chrome
if (chromePath) {
  puppeteerConfig.executablePath = chromePath;
}

create({
  session: 'financeiro',
  catchQR: (base64Qr, asciiQR) => {
    console.log('📱 QR CODE - ESCANEIE COM WHATSAPP:');
    console.log('='.repeat(60));
    console.log(asciiQR);
    console.log('='.repeat(60));
    console.log('📱 Abra WhatsApp → Aparelhos conectados → Conectar aparelho');
    console.log('📱 Escaneie o código QR acima');
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
      console.log('💬 WhatsApp conectado e pronto!');
    }
  },
  puppeteerOptions: puppeteerConfig,
  headless: true,
  devtools: false,
  useChrome: false, // Deixar false para usar Chromium
  debug: false,
  logQR: true
})
.then((clientInstance) => {
  client = clientInstance;
  console.log('✅ Cliente WhatsApp criado com sucesso!');
  start(client);
})
.catch((error) => {
  console.error('❌ Erro ao inicializar WhatsApp:', error);
  console.log('🔄 Tentando com configuração alternativa...');
  
  // Tentar com configuração mais simples
  tryAlternativeConfig();
});

function tryAlternativeConfig() {
  console.log('🔧 Tentando configuração alternativa...');
  
  create({
    session: 'financeiro-alt',
    catchQR: (base64Qr, asciiQR) => {
      console.log('📱 QR CODE - ESCANEIE COM WHATSAPP:');
      console.log('='.repeat(60));
      console.log(asciiQR);
      console.log('='.repeat(60));
    },
    statusFind: (statusSession) => {
      console.log('📊 Status:', statusSession);
      if (statusSession === 'qrReadSuccess') {
        console.log('✅ Conectado!');
      }
    },
    puppeteerOptions: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    headless: true,
    useChrome: false,
    debug: false
  })
  .then((clientInstance) => {
    client = clientInstance;
    console.log('✅ Configuração alternativa funcionou!');
    start(client);
  })
  .catch((error) => {
    console.error('❌ Configuração alternativa também falhou:', error);
    console.log('🔄 Reiniciando em 60 segundos...');
    setTimeout(() => {
      process.exit(1);
    }, 60000);
  });
}

function start(client) {
  console.log('🎯 Bot ativo e aguardando mensagens!');
  console.log('📱 Envie uma mensagem para o número conectado para testar');
  
  client.onMessage(async (message) => {
    if (!message.isGroupMsg) {
      const msg = message.body.toLowerCase().trim();
      const from = message.from;
      
      console.log(`📩 Nova mensagem: "${msg}" de ${from}`);
      
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
          const vencimentos = `📅 *VENCIMENTOS*

🔔 *PRÓXIMOS 7 DIAS:*
Nenhum vencimento próximo

✅ Situação: Todas as contas em dia!

_Verificado: ${new Date().toLocaleString('pt-BR')}_`;
          
          await client.sendText(from, vencimentos);
          console.log('✅ Vencimentos enviados!');
        }
        
        else if (msg === '/help' || msg === 'help' || msg === 'menu') {
          const menu = `🤖 *COMANDOS DISPONÍVEIS*

📊 */resumo* - Ver resumo financeiro
📋 */status* - Ver todos os itens
📅 */vencimentos* - Ver vencimentos próximos
❓ */help* - Ver este menu

*Como usar:*
Digite qualquer comando acima

*Exemplo:*
/resumo
/status
/vencimentos`;
          
          await client.sendText(from, menu);
          console.log('✅ Menu enviado!');
        }
        
        else {
          await client.sendText(from, `👋 Olá! Sou seu assistente financeiro.

Digite */help* para ver os comandos disponíveis.`);
          console.log('✅ Boas-vindas enviadas!');
        }
        
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
        await client.sendText(from, '❌ Erro no sistema. Tente novamente.');
      }
    }
  });
}
