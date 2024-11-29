const { generateResponse } = require("../../utils/openaiClient");

const IGNORE_PREFIX = "!";

/**
 * Handle incoming messages and generate responses using OpenAI.
 *
 * @param {import('discord.js').Client} client - The Discord client instance.
 * @param {import('discord.js').Message} message - The message object.
 */
module.exports = async (client, message) => {
  if (message.author.bot || message.content.startsWith(IGNORE_PREFIX)) return;

  const chatChannelId = process.env.CHANNEL_ID;

  if (message.channel.id === chatChannelId) {
    await message.channel.sendTyping();
    const sendTypingInterval = setInterval(
      () => message.channel.sendTyping(),
      5000
    );

    let conversation = [
      {
        role: "system",
        content:
          "Tao exudes an authoritative presence, delivering guidance with unwavering directness that commands respect within the community. Her enigmatic allure and subtle charm create a captivating interaction, balancing stern leadership with a magnetic sophistication. While maintaining a firm and disciplined demeanor, Tao’s sophisticated intelligence ensures she remains both intimidating and irresistibly engaging, fostering a space where respect and intrigue coexist seamlessly.",
      },
    ];

    try {
      // Fetch the last 10 messages from the channel to maintain better context
      let prevMessages = await message.channel.messages.fetch({ limit: 10 });
      prevMessages = prevMessages
        .filter(
          (msg) => !msg.author.bot && !msg.content.startsWith(IGNORE_PREFIX)
        )
        .reverse();

      // Add previous messages to the conversation
      prevMessages.forEach((msg) => {
        const username = msg.author.username
          .replace(/\s+/g, "_")
          .replace(/[^\w\s]/gi, "");
        conversation.push({
          role: msg.author.id === client.user.id ? "assistant" : "user",
          name: username,
          content: msg.content,
        });
      });

      // Add the current message to the conversation
      conversation.push({
        role: "user",
        name: message.author.username
          .replace(/\s+/g, "_")
          .replace(/[^\w\s]/gi, ""),
        content: message.content,
      });

      // Generate response using OpenAI API
      let response;
      try {
        response = await generateResponse(conversation);
      } catch (error) {
        console.error("OpenAI Error:\n", error);
        await message.reply(
          "I am sorry, but I am unable to respond at the moment. Please try again later."
        );
        clearInterval(sendTypingInterval);
        return;
      }

      clearInterval(sendTypingInterval);

      // Send the response to the user in chunks if it exceeds the character limit
      const responseMessage = response;
      const chunkSizeLimit = 2000;
      for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
        const chunk = responseMessage.substring(i, i + chunkSizeLimit);
        await message.reply(chunk);
      }
    } catch (error) {
      console.error(
        `Error processing messages for channel ${message.channel.id}:\n`,
        error
      );
      clearInterval(sendTypingInterval);
      await message.reply(
        "There was an error processing your message. Please try again later."
      );
    }
  }
};