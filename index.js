const { create } = require('@wppconnect-team/wppconnect');
const express = require('express');
const fs = require('fs');
const path = require('path');

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

// Função para encontrar Chrome automaticamente
function findChrome() {
  const basePath = '/opt/render/.cache/puppeteer/chrome';
  
  try {
    if (fs.existsSync(basePath)) {
      const versions = fs.readdirSync(basePath);
      console.log('📁 Versões encontradas:', versions);
      
      for (const version of versions) {
        const chromePath = path.join(basePath, version, 'chrome-linux64', 'chrome');
        if (fs.existsSync(chromePath)) {
          console.log(`✅ Chrome encontrado em: ${chromePath}`);
          return chromePath;
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Erro ao procurar Chrome:', error.message);
  }
  
  return null;
}

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
    '--disable-gpu'
  ]
};

// Só definir executablePath se encontrou Chrome
if (chromePath) {
  puppeteerConfig.executablePath = chromePath;
  console.log(`🔍 Usando Chrome em: ${chromePath}`);
} else {
  console.log('⚠️ Chrome não encontrado, usando padrão do sistema');
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
    console.log('📊 Status:', statusSession);
    if (statusSession === 'qrReadSuccess') {
      console.log('✅ QR Code escaneado!');
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
  useChrome: chromePath ? true : false,
  debug: false,
  logQR: true
})
.then((clientInstance) => {
  client = clientInstance;
  console.log('✅ Cliente WhatsApp criado com sucesso!');
  start(client);
})
.catch((error) => {
  console.error('❌ Erro ao inicializar:', error);
  console.log('🔄 Tentando novamente em 30 segundos...');
  setTimeout(() => {
    process.exit(1);
  }, 30000);
});

function start(client) {
  console.log('🎯 Bot ativo e aguardando mensagens!');
  
  client.onMessage(async (message) => {
    if (!message.isGroupMsg) {
      const msg = message.body.toLowerCase().trim();
      const from = message.from;
      
      console.log(`📩 Mensagem recebida: "${msg}"`);
      
      try {
        let response = '';
        
        if (msg === '/resumo' || msg === 'resumo') {
          response = `📊 *RESUMO FINANCEIRO*

✅ Pagos: 2
⏳ Pendentes: 0
❌ Vencidos: 0

📈 100% das contas em dia!

_Atualizado: ${new Date().toLocaleString('pt-BR')}_`;
        }
        
        else if (msg === '/status' || msg === 'status') {
          response = `📋 *STATUS DETALHADO*

✅ Conta de Luz - R$ 150,00
✅ Internet - R$ 100,00

💰 Total: R$ 250,00`;
        }
        
        else if (msg === '/vencimentos' || msg === 'vencimentos') {
          response = `📅 *VENCIMENTOS*

🔔 Próximos 7 dias: Nenhum
✅ Todas as contas em dia!

_Verificado: ${new Date().toLocaleString('pt-BR')}_`;
        }
        
        else if (msg === '/help' || msg === 'help' || msg === 'menu') {
          response = `🤖 *COMANDOS DISPONÍVEIS*

📊 */resumo* - Ver resumo
📋 */status* - Ver detalhes  
📅 */vencimentos* - Ver vencimentos
❓ */help* - Este menu

*Como usar:*
Digite qualquer comando acima`;
        }
        
        else {
          response = `👋 Olá! Sou seu assistente financeiro.

Digite */help* para ver os comandos disponíveis.`;
        }
        
        await client.sendText(from, response);
        console.log('✅ Resposta enviada com sucesso!');
        
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
        await client.sendText(from, '❌ Erro no sistema. Tente novamente.');
      }
    }
  });
}
