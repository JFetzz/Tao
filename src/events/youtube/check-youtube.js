const Parser = require("rss-parser");
const NotificationConfig = require("../../models/NotificationConfig");
const Bottleneck = require("bottleneck");

const parser = new Parser();

// Add a rate limiter to control the API requests
const limiter = new Bottleneck({
  minTime: 1000, // Minimum 1 second between requests
  maxConcurrent: 5, // Maximum 5 concurrent requests
});

/**
 * @param {import('discord.js').Client} client - The Discord client instance.
 */
module.exports = (client) => {
  checkYoutube();
  setInterval(checkYoutube, 60_000);

  async function checkYoutube() {
    try {
      const notificationConfigs = await NotificationConfig.find();

      for (const config of notificationConfigs) {
        await limiter.schedule(async () => {
          const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${config.ytChannelId}`;
          let feed;
          
          try {
            feed = await parser.parseURL(YOUTUBE_RSS_URL);
          } catch (error) {
            console.error(`Error fetching YouTube channel feed for ID ${config.ytChannelId}:`, error);
            return;
          }

          if (!feed?.items.length) return;

          const latestVideo = feed.items[0];
          const lastCheckedVid = config.lastCheckedVid;

          if (
            !lastCheckedVid ||
            (latestVideo.id.split(":")[2] !== lastCheckedVid.id &&
              new Date(latestVideo.pubDate) > new Date(lastCheckedVid.pubDate))
          ) {
            const targetGuild = await fetchGuild(client, config.guildId);
            if (!targetGuild) {
              console.error(`Guild not found: ${config.guildId}. Deleting config.`);
              await NotificationConfig.findOneAndDelete({ _id: config._id });
              return;
            }

            const targetChannel = await fetchChannel(targetGuild, config.notificationChannelId);
            if (!targetChannel) {
              console.error(`Channel not found: ${config.notificationChannelId}. Deleting config.`);
              await NotificationConfig.findOneAndDelete({ _id: config._id });
              return;
            }

            config.lastCheckedVid = {
              id: latestVideo.id.split(":")[2] ?? null,
              pubDate: latestVideo.pubDate,
            };

            await config.save();
            const message = formatMessage(config.customMessage, feed, latestVideo);
            targetChannel.send(message);
          }
        });
      }
    } catch (error) {
      console.error(`❌ Error in ${__filename} during checkYoutube:`, error);
    }
  }

  async function fetchGuild(client, guildId) {
    try {
      return (
        client.guilds.cache.get(guildId) ||
        (await client.guilds.fetch(guildId))
      );
    } catch (error) {
      console.error(`Failed to fetch guild with ID ${guildId}:`, error);
      return null;
    }
  }

  async function fetchChannel(guild, channelId) {
    try {
      return (
        guild.channels.cache.get(channelId) ||
        (await guild.channels.fetch(channelId))
      );
    } catch (error) {
      console.error(`Failed to fetch channel with ID ${channelId} in guild ${guild.id}:`, error);
      return null;
    }
  }

  function formatMessage(template, feed, video) {
    return (
      template
        ?.replace("{VIDEO_URL}", video.link)
        ?.replace("{VIDEO_TITLE}", video.title)
        ?.replace("{CHANNEL_URL}", feed.link)
        ?.replace("{CHANNEL_NAME}", feed.title) ||
      `New upload by ${feed.title}\n${video.link}`
    );
  }
};
