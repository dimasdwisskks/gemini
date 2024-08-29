require('dotenv').config();
const { HyWaBot, HytechMessages, HytechHandle, HytechHandleGemini } = require('wabot-ai');
const data = {
    phoneNumber: process.env.PHONE,
    sessionId: 'session',
    useStore: true,
};
const bot = new HyWaBot(data);
bot.start()
    .then(sock => {
        sock.ev.on('messages.upsert', async chatUpdate => {
            try {
                let m = chatUpdate.messages[0];
                if (!m.message) return;
                const result = await HytechMessages(m);
                console.log('Processed message:', result);
                let cmd;
                if (result.chatsFrom === 'private') {
                    cmd = result.message;
                } else if (result.chatsFrom === 'group') {
                    cmd = result.participant ? result.participant.message : result.message;
                }
                if (cmd.startsWith(process.env.PREFIX_OPENAI)) {
                    const messageToProcess = cmd.replace(process.env.PREFIX_OPENAI, '').trim();
                    const response = await HytechHandle(messageToProcess);
                    sock.sendMessage(result.remoteJid, { text: response });
                }
                if (cmd.startsWith(process.env.PREFIX_GEMINI)) {
                    const messageToProcess = cmd.replace(process.env.PREFIX_GEMINI, '').trim();
                    const response = await HytechHandleGemini(messageToProcess);
                    sock.sendMessage(result.remoteJid, { text: response });
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });
    })
    .catch(error => {
        console.error('Error starting bot:', error);
    });