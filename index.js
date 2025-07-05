const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

let qrCodeData = '';

app.get('/', (req, res) => {
  if (qrCodeData) {
    res.send(`
      <html>
        <head>
          <title>WhatsApp Bot - QR Code</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        </head>
        <body style="text-align: center; font-family: Arial;">
          <h1>🤖 Bot WhatsApp Financeiro</h1>
          <h2>📱 Escaneie o QR Code com WhatsApp</h2>
          <div id="qrcode"></div>
          <p>Abra WhatsApp → Aparelhos conectados → Conectar aparelho</p>
          <script>
            QRCode.toCanvas(document.getElementById('qrcode'), '${qrCodeData}', function (error) {
              if (error) console.error(error);
            });
          </script>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
        <body style="text-align: center; font-family: Arial;">
          <h1>🤖 Bot WhatsApp Financeiro Online!</h1>
          <p>Aguardando QR Code...</p>
          <p>Recarregue a página em alguns segundos</p>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: https://whatsapp-financeiro.onrender.com para ver o QR Code`);
});

console.log('🔧 Iniciando WhatsApp Bot com Baileys...');

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false
      // Removemos o logger que estava causando erro
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        qrCodeData = qr;
        console.log('📱 QR CODE GERADO!');
        console.log('🌐 Acesse: https://whatsapp-financeiro.onrender.com');
        console.log('📱 Para ver o QR Code visual');
        console.log('='.repeat(60));
        
        // QR Code no terminal
        qrcode.generate(qr, { small: false });
        
        console.log('='.repeat(60));
        console.log('📱 COMO ESCANEAR:');
        console.log('1. Abra WhatsApp no celular');
        console.log('2. Vá em Aparelhos conectados');
        console.log('3. Conectar aparelho');
        console.log('4. Escaneie o código acima OU');
        console.log('5. Acesse o link para ver QR visual');
        console.log('='.repeat(60));
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('❌ Conexão fechada. Reconectando:', shouldReconnect);
        qrCodeData = '';
        if (shouldReconnect) {
          setTimeout(() => {
            startBot();
          }, 5000);
        }
      } else if (connection === 'open') {
        console.log('✅ WhatsApp conectado com sucesso!');
        console.log('🎯 Bot ativo e aguardando mensagens!');
        qrCodeData = '';
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      const message = m.messages[0];
      
      if (!message.key.fromMe && message.message) {
        const from = message.key.remoteJid;
        const text = message.message.conversation || 
                    message.message.extendedTextMessage?.text || '';
        const msg = text.toLowerCase().trim();
        
        console.log(`📩 Nova mensagem: "${msg}" de ${from}`);
        
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
✅ Todas as contas em dia!`;
          }
          
          else if (msg === '/help' || msg === 'help') {
            response = `🤖 *COMANDOS*

📊 /resumo - Ver resumo
📋 /status - Ver detalhes
📅 /vencimentos - Ver vencimentos
❓ /help - Este menu

Digite qualquer comando!`;
          }
          
          else {
            response = `👋 Olá! Sou seu assistente financeiro.

Digite /help para ver os comandos.`;
          }
          
          await sock.sendMessage(from, { text: response });
          console.log('✅ Resposta enviada!');
          
        } catch (error) {
          console.error('❌ Erro ao processar:', error);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao inicializar:', error);
    setTimeout(() => {
      startBot();
    }, 10000);
  }
}

startBot();
