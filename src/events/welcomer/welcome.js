const WelcomeChannel = require("../../models/WelcomeChannel");

/**
 * Handle new guild member additions and send a welcome message.
 *
 * @param {import('discord.js').Client} client - The Discord client instance.
 */
module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    try {
      // Fetch welcome channel configuration
      const welcomeChannel = await WelcomeChannel.findOne({
        guildId: member.guild.id,
      });

      if (!welcomeChannel) return;

      // Fetch the target channel
      const targetChannel = member.guild.channels.cache.get(
        welcomeChannel.channelId
      );
      if (!targetChannel) return;

      // Prepare the welcome message
      const customMessage =
        welcomeChannel.customMessage
          ?.replace("{mention-member}", member.toString())
          ?.replace("{username}", member.user.username)
          ?.replace("{server-name}", member.guild.name) ||
        `👋 Welcome to ${member.guild.name}, ${member}!`;

      // Check if the new member is a bot or a user and adjust the message
      const finalMessage = member.user.bot
        ? `🤖 ${customMessage} (It's a bot!)`
        : customMessage;

      // Send the welcome message
      targetChannel.send(finalMessage);
    } catch (error) {
      console.error(
        `❌ Error in ${__filename} during guildMemberAdd event:`,
        error
      );
    }
  });
};
