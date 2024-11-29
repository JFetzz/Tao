const { Client, ActivityType } = require('discord.js');

/**
 * Log the bot in and set a random activity status
 * 
 * @param {Client} client 
 */
module.exports = (client) => {
    const activities = [
    { name: "Pondering Finality...", type: ActivityType.Custom },
    { name: "Resetting...", type: ActivityType.Custom },
    { name: "Gazing into the abyss...", type: ActivityType.Custom },
    { name: "Drifting...", type: ActivityType.Custom },
    ];

    function updateStatus() {
        const activity = activities[Math.floor(Math.random()*activities.length)];
        client.user.setActivity(activity.name, { type: activity.type });
    }

    console.log('🎭 Activities Set!');
    updateStatus();
    setInterval(updateStatus, 20000);
};