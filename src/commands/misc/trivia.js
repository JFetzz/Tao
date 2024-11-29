module.exports = {
    name: 'trivia',
    description: 'Starts a trivia question and waits for the correct answer!',
    options: [],
    deleted: false,
  
    callback: async (client, interaction) => {
      const triviaQuestions = require('../../utils/triviaQuestions');
      const selectedQuestion =
        triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
  
      await interaction.deferReply();
  
      const triviaEmbed = {
        title: "🧠 Trivia Time!",
        description: selectedQuestion.question,
        timestamp: new Date(),
      };
  
      await interaction.editReply({ embeds: [triviaEmbed], fetchReply: true });
  
      const filter = (m) => m.author.id === interaction.user.id;
  
      const collector = interaction.channel.createMessageCollector({
        filter,
        time: 15000,
      });
  
      collector.on("collect", (m) => {
        if (m.content.toLowerCase() === selectedQuestion.answer.toLowerCase()) {
          m.reply(`Correct! The answer is indeed ${selectedQuestion.answer}.`);
          collector.stop();
        } else {
          m.reply("That's not quite right. Try again!");
        }
      });
  
      collector.on("end", (collected) => {
        if (
          collected.size === 0 ||
          !collected.some(
            (m) =>
              m.content.toLowerCase() === selectedQuestion.answer.toLowerCase()
          )
        ) {
          interaction.followUp("Time's up! No correct answer was provided.");
        }
      });
    },
  };