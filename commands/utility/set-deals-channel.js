const fs = require('node:fs');
const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set-deals-channel')
		.setDescription('Marks a channel as a deals channel for moderation purposes')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    	.setDMPermission(false)
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to enable moderation in')
				.setRequired(true))
		.addRoleOption(option =>
			option.setName('notification-role')
				.setDescription('What notification role the bot should ping')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('deal-name')
				.setDescription('What the bot refers to the deal name as (e.g. "deal", "Pokemon Center link", "merch link")')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('ping-enabled')
				.setDescription('Should the bot ping when deals are posted?')
				.setRequired(true)),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel')
		const notificationRole = interaction.options.getRole('notification-role')
		const dealName = interaction.options.getString('deal-name')
		const pingEnabled = interaction.options.getBoolean('ping-enabled')

		if (interaction.client.channelConfig[channel.id]) {
			await interaction.reply({ 
				content: ':x: This channel already has deals moderation enabled!', 
				flags: MessageFlags.Ephemeral
			});
		} else {
			interaction.client.channelConfig[channel.id] = {
				notificationRole: notificationRole.id,
				dealName: dealName,
				lastPing: null,
				pingEnabled: pingEnabled
			}

			fs.writeFile(interaction.client.channelConfigFileName, JSON.stringify(interaction.client.channelConfig), async err => {
				if (err) {
					console.error("Couldn't write channel config:", err);
					
					await interaction.reply({ 
						content: ':x: Something went wrong when trying to save channel configuration. Please tell Cloak!', 
						flags: MessageFlags.Ephemeral
					});
				} else {
					var textContent = ''

					const modRole = interaction.guild.roles.cache.find(r => r.name === 'Moderators')
					const adminRole = interaction.guild.roles.cache.find(r => r.name === 'Admins')

					var addNewline = false

					if (modRole != undefined) {
						textContent = textContent + modRole.toString() + " "
						addNewline = true
					}

					if (adminRole != undefined) {
						textContent = textContent + adminRole.toString() + " "
						addNewline = true
					}

					if (addNewline) {
						textContent = textContent + "\n\n"
					}

					textContent = textContent + ':white_check_mark: Enabled deals moderation in channel ' + channel.toString() + ' at the request of ' + interaction.member.toString() + '.\n\n'

					textContent = textContent + '[Settings] Notification Role: ' + notificationRole.toString() + ' Pings enabled? ' + pingEnabled + " Deal name? '" + dealName + "'"

					await interaction.reply({ 
						content: textContent
					});
				}
			});
		}
	},
};