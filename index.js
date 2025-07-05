const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('🤖 Bot WhatsApp Financeiro Online!');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('📱 QR CODE - ESCANEIE COM WHATSAPP:');
      console.log('='.repeat(50));
      qrcode.generate(qr, { small: true });
      console.log('='.repeat(50));
      console.log('📱 Abra WhatsApp → Aparelhos conectados');
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp conectado!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];
    if (!message.key.fromMe && message.message) {
      const from = message.key.remoteJid;
      const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
      const msg = text.toLowerCase().trim();
      
      console.log(`📩 Mensagem: "${msg}"`);
      
      let response = '';
      
      if (msg === '/resumo' || msg === 'resumo') {
        response = `📊 *RESUMO FINANCEIRO*

✅ Pagos: 2
⏳ Pendentes: 0
❌ Vencidos: 0

📈 100% das contas em dia!`;
      }
      
      else if (msg === '/status' || msg === 'status') {
        response = `📋 *STATUS DETALHADO*

✅ Conta de Luz - R$ 150,00
✅ Internet - R$ 100,00

💰 Total: R$ 250,00`;
      }
      
      else if (msg === '/help' || msg === 'help') {
        response = `🤖 *COMANDOS*

📊 /resumo - Ver resumo
📋 /status - Ver detalhes
❓ /help - Este menu`;
      }
      
      else {
        response = '👋 Olá! Digite /help para ver os comandos.';
      }
      
      await sock.sendMessage(from, { text: response });
      console.log('✅ Resposta enviada!');
    }
  });
}

startBot().catch(console.error);
