// youtube-notification-setup.js in src/commands/misc
const {
    ChannelType,
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionFlagsBits,
} = require('discord.js');
const NotificationConfig = require('../../models/NotificationConfig');
const Parser = require('rss-parser');

const parser = new Parser();

module.exports = {
    name: 'youtube-notification-setup',
    description: 'Setup YouTube notifications for a channel.',
    options: [
        {
            name: 'youtube-id',
            description: 'The ID of the YouTube channel.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'target-channel',
            description: 'The channel to get notifications in',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
            required: true,
        },
        {
            name: 'custom-message',
            description: 'Templates: {VIDEO_TITLE} {VIDEO_URL} {CHANNEL_NAME} {CHANNEL_URL}',
            type: ApplicationCommandOptionType.String,
        },
    ],
    callback: async (client, interaction) => {
        console.log('Executing command: youtube-notification-setup'); // Added for debugging

        if (!interaction.inGuild()) {
            await interaction.reply({
                content: 'You can only run this command inside a server.',
                ephemeral: true,
            });
            return;
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            const targetYtChannelId = interaction.options.getString('youtube-id');
            const targetNotificationChannel = interaction.options.getChannel('target-channel');
            const targetCustomMessage = interaction.options.getString('custom-message');

            const duplicateExists = await NotificationConfig.exists({
                notificationChannelId: targetNotificationChannel.id,
                ytChannelId: targetYtChannelId,
            });

            if (duplicateExists) {
                await interaction.editReply(
                    'That YouTube channel has already been configured for that text channel.\nRun `/youtube-notification-remove` first.'
                );
                console.log(`Duplicate configuration found for channel ID ${targetYtChannelId}`);
                return;
            }

            const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${targetYtChannelId}`;

            let feed;
            try {
                feed = await parser.parseURL(YOUTUBE_RSS_URL);
            } catch (error) {
                console.error(`Error fetching YouTube channel feed for ID ${targetYtChannelId}:`, error);
                await interaction.editReply(
                    'There was an error fetching the channel. Ensure the ID is correct and that the channel is accessible.'
                );
                return;
            }

            if (!feed) return;

            const channelName = feed.title;

            const notificationConfig = new NotificationConfig({
                guildId: interaction.guildId,
                notificationChannelId: targetNotificationChannel.id,
                ytChannelId: targetYtChannelId,
                customMessage: targetCustomMessage,
                lastChecked: new Date(),
                lastCheckedVid: null,
            });

            if (feed.items.length) {
                const latestVideo = feed.items[0];
                const videoId = latestVideo.id.split(':')[2] ?? null;

                if (!videoId) {
                    console.error(`Invalid video ID format for channel ${targetYtChannelId}`);
                    return;
                }

                notificationConfig.lastCheckedVid = {
                    id: videoId,
                    pubDate: latestVideo.pubDate,
                };
            }

            await notificationConfig.save();

            const embed = new EmbedBuilder()
                .setTitle('✅ YouTube Channel Configuration Success!')
                .setDescription(
                    `${targetNotificationChannel} will now get notified whenever there's a new upload by ${channelName}`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(
                `Error setting up YouTube notifications for guild ${interaction.guild.id} in channel ${interaction.channel.id}:`,
                error
            );
            await interaction.editReply({
                content:
                    'There was an error setting up the YouTube notifications. Please try again.',
                ephemeral: true,
            });
        }
    },
};
