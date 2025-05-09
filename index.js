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
		// Set a new item in the Collection with the key as the command name and the value as the exported module
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

const override = 'bot override'

const rolePingOverride = '<@&'

const whitelistProducts = [
    'booster',
    'bundle',
    'bobu',
    'pack',
    'etb',
    'spc',
	'upc',
    'premium',
    'collection',
    'bb',
    'box',
    'b&b',
    'build',
    'battle',
    'sleeved',
    'checklane',
    'tin',
    'bw',
    'blooming waters',
    'sea and sky',
    'sea & sky',
    'boxes',
    'jt',
    'journey',
    'dr',
    'destined',
    'prismatic',
    '151',
    'ssp',
    'surging',
    'twm',
    'twilight',
    'scr',
    'stellar'
]

const whitelistLocations = [
    'walmart',
	'wm',
    'pc',
    'pokemon center',
    'gamestop',
    'gs',
    'mastermind',
    'costco',
    'amazon',
    'zephyr',
    'ze',
    'flaring',
    'kanzen',
    'shoppers',
    'best buy',
    'london drugs'
]

const roleQuestionKeywords = [
    'how',
    'where'
]

const roleKeywords = [
    'role',
    'ping'
]

client.on(Events.MessageCreate, async (message) => {
    var roleQuestion = false

    for (const questionKeyword of roleQuestionKeywords) {
        if (roleQuestion) {
            break
        }

        if (message.content.toLowerCase().includes(questionKeyword)) {
            for (const roleKeyword of roleKeywords) {
                if (message.content.toLowerCase().includes(roleKeyword)) {
                    roleQuestion = true
                    break
                }
            }
        } 
    }

    if (roleQuestion) {
        console.log(message.member + ' (' + message.member.displayName + ') seems to be asking about how to get roles, will answer')
        
    }

    if (client.channelConfig[message.channel.id]) {
        if (message.author.bot) return;

        console.log("Found a message in deals moderated channel #" + message.channel.name)
        console.log("Content: " + message.content)
        console.log("Author: " + message.member + ' (' + message.member.displayName + ')')

        var approved = false

        for (const product of whitelistProducts) {
            if (approved) {
                break
            }

            if (message.content.toLowerCase().includes(product)) {
                for (const location of whitelistLocations) {
                    if (message.content.toLowerCase().includes(location)) {
                        approved = true
                        break
                    }
                }
            } 
        }

        if (message.content.toLowerCase().includes('http') || message.content.toLowerCase().includes('www')) {
            approved = true
        }

        if (message.content.toLowerCase().includes(override)) {
            approved = true
        }

        if (message.content.toLowerCase().includes(rolePingOverride)) {
            approved = true
        }

        // Mod check
        if (!approved && message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            console.log("Message doesn't seem to be deals related, but user has moderator permissions. Bypassing...")

            message.author.send("[MOD BYPASS] Your message in " + message.channel.toString() + " doesn't appear to contain both a deal link and location."
                + "\n\nAs deals moderation is enabled in this channel, it would normally be deleted, but this has been skipped due to your mod permissions."
                + "\nHowever, a ping has not been created. If you want to ping for this message, you can resend the message and include the words `bot override`."
            )
        } else if (approved) {
            if (client.channelConfig[message.channel.id].pingEnabled) {
                console.log("Message looks good! Sending a ping...")

                await message.channel.send(message.member.toString() + ` posted a ${client.channelConfig[message.channel.id].dealName}! <@&${client.channelConfig[message.channel.id].notificationRole}>` 
                + "\n\nHead over to https://discord.com/channels/750916599749410856/1149025666377973892 to check if there are any discount codes for any deals posted here.")
                .then(async newMsg => {
                    const lastPing = client.channelConfig[message.channel.id].lastPing

                    if (lastPing != null) {
                        await message.channel.messages.fetch(client.channelConfig[message.channel.id].lastPing)
                        .then(async lastMsg => await lastMsg.delete())
                        .catch(console.error);
                    }

                    client.channelConfig[message.channel.id].lastPing = newMsg.id

                    fs.writeFile(client.channelConfigFileName, JSON.stringify(client.channelConfig), async err => {
                        if (err) {
                            console.error("Couldn't write channel config:", err);
                        }
                    })
                })
            } else {
                console.log("Message looks good! Pings aren't enabled, so no ping will be sent.")
            }
        } else {
            console.log("Message doesn't seem to be deals related. Deleting...")
            await message.delete()

            message.author.send("Your message in " + message.channel.toString() + " was deleted because it doesn't contain both a deal link and location."
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

    db.run(`
        CREATE TABLE IF NOT EXISTS gacha_roles(
            uid INTEGER PRIMARY KEY,
            role_id TEXT,
            tickets INTEGER
        ) STRICT
    `)

    db.run(`
        CREATE TABLE IF NOT EXISTS gacha_role_users(
            uid INTEGER PRIMARY KEY,
            user_id TEXT,
            role_id TEXT
        )
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