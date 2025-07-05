const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

let qrCodeData = '';
let botNumber = '';

app.get('/', (req, res) => {
  if (botNumber) {
    res.send(`
      <html>
        <body style="text-align: center; font-family: Arial; padding: 20px;">
          <h1>🤖 Bot WhatsApp Financeiro</h1>
          <h2>✅ CONECTADO COM SUCESSO!</h2>
          <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px;">
            <h3>📱 NÚMERO DO BOT:</h3>
            <h2 style="color: #25D366; font-size: 2em;">${botNumber}</h2>
          </div>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 10px;">
            <h3>💬 COMO TESTAR:</h3>
            <p>1. Abra WhatsApp no celular</p>
            <p>2. Envie mensagem para: <strong>${botNumber}</strong></p>
            <p>3. Digite: <strong>/help</strong></p>
          </div>
          <div style="background: #fff8dc; padding: 15px; border-radius: 10px; margin-top: 15px;">
            <h3>🤖 COMANDOS DISPONÍVEIS:</h3>
            <p>/help - Ver menu</p>
            <p>/resumo - Ver resumo financeiro</p>
            <p>/status - Ver status detalhado</p>
            <p>/vencimentos - Ver vencimentos</p>
          </div>
        </body>
      </html>
    `);
  } else if (qrCodeData) {
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
          <h1>🤖 Bot WhatsApp Financeiro</h1>
          <p>⏳ Aguardando conexão...</p>
          <p>🔄 Recarregue a página em alguns segundos</p>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: https://whatsapp-financeiro.onrender.com`);
});

console.log('🔧 Iniciando WhatsApp Bot com Baileys...');

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        qrCodeData = qr;
        console.log('📱 QR CODE GERADO!');
        console.log('🌐 Acesse: https://whatsapp-financeiro.onrender.com');
        console.log('='.repeat(60));
        qrcode.generate(qr, { small: false });
        console.log('='.repeat(60));
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('❌ Conexão fechada. Reconectando:', shouldReconnect);
        qrCodeData = '';
        botNumber = '';
        if (shouldReconnect) {
          setTimeout(() => {
            startBot();
          }, 5000);
        }
      } else if (connection === 'open') {
        console.log('✅ WhatsApp conectado com sucesso!');
        
        // FORÇAR EXIBIÇÃO DO NÚMERO
        setTimeout(() => {
          try {
            const userInfo = sock.user;
            if (userInfo && userInfo.id) {
              botNumber = userInfo.id.split('@')[0];
              
              console.log('🎯'.repeat(20));
              console.log('📱 NÚMERO DO BOT ENCONTRADO!');
              console.log('🎯'.repeat(20));
              console.log(`📱 NÚMERO: ${botNumber}`);
              console.log(`👤 NOME: ${userInfo.name || 'Bot Financeiro'}`);
              console.log(`💬 ENVIE MENSAGEM PARA: ${botNumber}`);
              console.log(`🌐 OU ACESSE: https://whatsapp-financeiro.onrender.com`);
              console.log('🎯'.repeat(20));
              console.log('💡 COMO TESTAR:');
              console.log('1. Abra WhatsApp no celular');
              console.log(`2. Envie mensagem para: ${botNumber}`);
              console.log('3. Digite: /help');
              console.log('🎯'.repeat(20));
            } else {
              console.log('⚠️ Não foi possível obter o número do bot');
              console.log('🔍 Tentando novamente...');
              setTimeout(() => {
                if (sock.user) {
                  botNumber = sock.user.id.split('@')[0];
                  console.log('📱 NÚMERO ENCONTRADO:', botNumber);
                }
              }, 2000);
            }
          } catch (error) {
            console.log('❌ Erro ao obter número:', error);
          }
        }, 1000);
        
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
        
        console.log(`📩 MENSAGEM RECEBIDA: "${msg}"`);
        console.log(`📱 DE: ${from}`);
        
        try {
          let response = '';
          
          if (msg === '/numero' || msg === 'numero') {
            response = `📱 *NÚMERO DO BOT*

🤖 Número: ${botNumber || sock.user?.id?.split('@')[0] || 'Não disponível'}
👤 Nome: ${sock.user?.name || 'Bot Financeiro'}
🔗 Status: Conectado

_Este é o número do bot!_`;
          }
          
          else if (msg === '/resumo' || msg === 'resumo') {
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
            response = `🤖 *ASSISTENTE FINANCEIRO*

*COMANDOS DISPONÍVEIS:*

📊 /resumo - Ver resumo
📋 /status - Ver detalhes
📅 /vencimentos - Ver vencimentos
📱 /numero - Ver número do bot
❓ /help - Este menu

*COMO USAR:*
Digite qualquer comando acima

_Bot funcionando perfeitamente!_`;
          }
          
          else {
            response = `👋 *Olá! Sou seu Assistente Financeiro.*

🤖 Estou funcionando perfeitamente!

Digite */help* para ver todos os comandos.

_Desenvolvido por Lopes - Marketing Digital_`;
          }
          
          await sock.sendMessage(from, { text: response });
          console.log('✅ RESPOSTA ENVIADA COM SUCESSO!');
          
        } catch (error) {
          console.error('❌ Erro ao processar mensagem:', error);
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
