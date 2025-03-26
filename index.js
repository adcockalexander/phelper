const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { token } = require('./config.json');
const http = require("http");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

const whitelist = [
    'walmart',
    'pc',
    'pokemon center',
    'gamestop',
    'gs',
    'mastermind',
    'costco',
    'bot override',
    'amazon',
    'zephyr',
    'ze',
    'flaring',
    'kanzen'
]

client.on(Events.MessageCreate, async (message) => {
    if (client.channelConfig[message.channel.id]) {
        if (message.author.bot) return;

        console.log("Found a message in deals moderated channel #" + message.channel.name)
        console.log("Content: " + message.content)
        console.log("Author: " + message.member + ' (' + message.member.displayName + ')')

        var approved = false

        // Mod check
        if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            approved = true
        }

        for (const whitelistString of whitelist) {
            if (message.content.includes(whitelistString)) {
                approved = true
            } 
        }

        if (message.content.includes('http') || message.content.includes('www')) {
            approved = true
        }

        if (approved) {
            console.log("Message looks good! Sending a ping...")

            message.channel.send(message.member.toString() + ` posted a ${client.channelConfig[message.channel.id].dealName}! <@&${client.channelConfig[message.channel.id].notificationRole}>` 
            + "\n\nHead over to https://discord.com/channels/750916599749410856/1149025666377973892 to check if there are any discount codes for any deals posted here.")
        } else {
            console.log("Message doesn't seem to be deals related. Deleting...")
            await message.delete()

            message.author.send("Your message in " + message.channel.toString() + " was deleted because it doesn't appear to be a deal link or location."
                + " Please use other channels for discussions. "
                + "\n\nIf you believe your message was deleted in error, you can override this by including the words `bot override` in your message. Abusing this may result in a mute or ban."
            )
        }
    }
})

const sqlite3 = require('sqlite3')

const db = new sqlite3.Database("codes.db")

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS codes(
            uid INTEGER PRIMARY KEY,
            key TEXT,
            type INTEGER,
            data TEXT
        ) STRICT
    `)
})

client.codeDb = db

client.channelConfigFileName = 'channel-config.json'

fs.readFile(client.channelConfigFileName, 'utf8', function (err, data) {
    if (err) {
        console.log("Couldn't read channel config file:", err)
        process.exitCode = 1
    } else {
        client.channelConfig = data

        console.log(data)

        if (client.channelConfig.length == 0) {
            client.channelConfig = '{}'
        }

        client.channelConfig = JSON.parse(client.channelConfig)

        client.once(Events.ClientReady, readyClient => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}`);
        });
        
        client.login(token);
    }
})
