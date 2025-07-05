const { create } = require('@wppconnect-team/wppconnect');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

let client;

// Servidor web para Railway
app.get('/', (req, res) => {
  res.send('🤖 Bot WhatsApp Financeiro está rodando!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Inicializar WhatsApp
console.log('🚀 Iniciando bot...');

create({
  session: 'financeiro-session',
  catchQR: (base64Qr, asciiQR) => {
    console.log('📱 ESCANEIE O QR CODE ABAIXO:');
    console.log(asciiQR);
    console.log('📱 Use a câmera do WhatsApp para escanear');
  },
  statusFind: (statusSession, session) => {
    console.log('📊 Status da sessão:', statusSession);
    if (statusSession === 'qrReadSuccess') {
      console.log('✅ WhatsApp conectado com sucesso!');
    }
  },
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
  console.error('❌ Erro ao inicializar:', error);
});

function start(client) {
  console.log('🎯 Bot ativo e aguardando mensagens!');
  
  client.onMessage(async (message) => {
    // Só responder mensagens privadas
    if (message.isGroupMsg === false) {
      const msg = message.body.toLowerCase().trim();
      const from = message.from;
      
      console.log(`📩 Mensagem de ${from}: ${msg}`);
      
      try {
        // Comando /resumo
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
        
        // Comando /status
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
        
        // Comando /vencimentos
        else if (msg === '/vencimentos' || msg === 'vencimentos') {
          const hoje = new Date();
          const vencimentos = `📅 *VENCIMENTOS*

🔔 *PRÓXIMOS 7 DIAS:*
Nenhum vencimento próximo

✅ Situação: Em dia!

_Verificado em: ${hoje.toLocaleString('pt-BR')}_`;
          
          await client.sendText(from, vencimentos);
          console.log('✅ Vencimentos enviados!');
        }
        
        // Comando /help
        else if (msg === '/help' || msg === 'help' || msg === 'menu') {
          const menu = `🤖 *COMANDOS DISPONÍVEIS*

📊 */resumo* - Ver resumo financeiro
📋 */status* - Ver todos os itens  
📅 */vencimentos* - Ver vencimentos
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
        
        // Primeira mensagem
        else {
          await client.sendText(from, `👋 Olá! Sou seu assistente financeiro.

Digite */help* para ver os comandos disponíveis.`);
          console.log('✅ Boas-vindas enviadas!');
        }
        
      } catch (error) {
        console.error('❌ Erro ao processar:', error);
        await client.sendText(from, '❌ Erro no sistema. Tente novamente.');
      }
    }
  });
}