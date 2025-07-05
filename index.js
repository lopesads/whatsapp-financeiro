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
    '--disable-gpu'
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
  console.error('❌ Erro:', error);
  setTimeout(() => {
    process.exit(1);
  }, 30000);
});

function start(client) {
  console.log('🎯 Bot ativo!');
  
  client.onMessage(async (message) => {
    if (!message.isGroupMsg) {
      const msg = message.body.toLowerCase().trim();
      const from = message.from;
      
      console.log(`📩 Mensagem: "${msg}"`);
      
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

Digite */help* para ver os comandos.`;
        }
        
        await client.sendText(from, response);
        console.log('✅ Resposta enviada!');
        
      } catch (error) {
        console.error('❌ Erro ao processar:', error);
        await client.sendText(from, '❌ Erro no sistema. Tente novamente.');
      }
    }
  });
}
