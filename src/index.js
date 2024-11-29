require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const consoleLog = require('./events/ready/consoleLog');
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
const registerCommands = require('./events/ready/01registerCommands');

console.log("🟢 Initializing Client...");
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildPresences,
    ],
});

(async () => {
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('🌎 Connected to DB.');
  
      eventHandler(client);
      client.login(process.env.TOKEN);

      client.once('ready', async () => {
        console.log("The bot is online!");
        consoleLog(client);

        // Register commands explicitly here
        await registerCommands(client);
        console.log("✅ Commands registered.");
      });

    } catch (error) {
      console.log(`Error: ${error}`);
    }
  })();
