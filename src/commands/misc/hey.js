module.exports = {
  name: 'hey', // Ensure this matches the intended command name
  description: 'Replies with a friendly greeting!',
  options: [], // Always include options, even if empty
  deleted: false, // Ensure this is not set to true

  callback: async (client, interaction) => {
    await interaction.deferReply();
    interaction.editReply('Hi :)');
  },
};
