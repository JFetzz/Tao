const {
    ChannelType,
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionFlagsBits,
} = require('discord.js');
const WelcomeChannel = require('../../models/WelcomeChannel');

module.exports = {
    name: 'setup-welcome-channel',
    description: 'Sets up the welcome channel for new members.',
    options: [
        {
            name: 'channel',
            description: 'The channel to send welcome messages to.',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
            required: true,
        },
        {
            name: 'message',
            description: 'The custom welcome message to send.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: 'You can only run this command inside a server.',
                ephemeral: true,
            });
            return;
        }

        const targetChannelId = interaction.options.getChannel('channel').id;
        const customMessage = interaction.options.getString('message');

        try {
            await interaction.deferReply({ ephemeral: true });

            let welcomeChannel = await WelcomeChannel.findOne({
                guildId: interaction.guild.id,
            });

            if (welcomeChannel) {
                welcomeChannel.channelId = targetChannelId;
                welcomeChannel.customMessage = customMessage;
            } else {
                welcomeChannel = new WelcomeChannel({
                    guildId: interaction.guild.id,
                    channelId: targetChannelId,
                    customMessage: customMessage,
                });
            }

            await welcomeChannel.save();

            const embed = new EmbedBuilder()
                .setTitle('✅ Welcome Channel Configuration Success!')
                .setDescription(
                    `Welcome channel has been set to <#${targetChannelId}>${
    customMessage ? ` with message: ${customMessage}` : ''
                    }`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(
                `Error setting up welcome channel in guild ${interaction.guild.id} for channel ${interaction.channel.id}:`,
                error
            );
            await interaction.editReply({
                content: 'There was an error setting up the welcome channel. Please try again.',
                ephemeral: true,
            });
        }
    },
};