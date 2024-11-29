const { testServer } = require('../../../config.json');
const areCommandsDifferent = require('../../utils/areCommandsDifferent');
const getApplicationCommands = require('../../utils/getApplicationCommands');
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = async (client) => {
  try {
    const localCommands = getLocalCommands();
    console.log('Local commands loaded:', localCommands.map(cmd => cmd?.name ?? 'undefined')); // Added for debugging

    // Filter out invalid commands and log a warning for each one
    const validCommands = localCommands.filter((command, index) => {
      if (!command || !command.name || !command.description) {
        console.warn(`[WARNING] Command at index ${index} is missing required properties and will be skipped.`);
        return false;
      }
      return true;
    });

    // Fetching application commands either globally or for a specific guild
    const applicationCommands = await getApplicationCommands(client, testServer);

    if (!applicationCommands) {
      console.error('Failed to fetch application commands. Ensure the client is initialized properly and has the required permissions.');
      return;
    }

    for (const localCommand of validCommands) {
      const { name, description, options } = localCommand;

      // Finding an existing command
      const existingCommand = applicationCommands.cache.find((cmd) => cmd.name === name);

      if (existingCommand) {
        // Delete command if marked for deletion
        if (localCommand.deleted) {
          await applicationCommands.delete(existingCommand.id);
          console.log(`🗑 Deleted command "${name}".`);
          continue;
        }

        // Update command if there are changes
        if (areCommandsDifferent(existingCommand, localCommand)) {
          await applicationCommands.edit(existingCommand.id, {
            description,
            options,
          });
          console.log(`🔁 Edited command "${name}".`);
        }
      } else {
        // Skip registering commands that are set for deletion
        if (localCommand.deleted) {
          console.log(`⏩ Skipping registering command "${name}" as it's set to delete.`);
          continue;
        }

        // Register new command
        try {
          await applicationCommands.create({
            name,
            description,
            options,
          });
          console.log(`👍 Registered command "${name}".`);
        } catch (error) {
          console.error(`Failed to register command "${name}":`, error);
        }
      }
    }
  } catch (error) {
    console.error(`There was an error in registering commands: ${error}`);
  }
};
