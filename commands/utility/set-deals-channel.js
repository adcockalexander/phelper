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
				.setRequired(true)),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel')
		const notificationRole = interaction.options.getRole('notification-role').id
		const dealName = interaction.options.getString('deal-name')

		if (interaction.client.channelConfig[channel.id]) {
			await interaction.reply({ 
				content: ':x: This channel already has deals moderation enabled!', 
				flags: MessageFlags.Ephemeral
			});
		} else {
			interaction.client.channelConfig[channel.id] = {
				notificationRole: notificationRole,
				dealName: dealName
			}

			fs.writeFile(interaction.client.channelConfigFileName, JSON.stringify(interaction.client.channelConfig), async err => {
				if (err) {
					console.error("Couldn't write channel config:", err);
					
					await interaction.reply({ 
						content: ':x: Something went wrong when trying to save channel configuration. Please tell Cloak!', 
						flags: MessageFlags.Ephemeral
					});
				} else {
					await interaction.reply({ 
						content: ':white_check_mark: *Enabled deals moderation in channel #' + channel.name + '*', 
						flags: MessageFlags.Ephemeral
					});
				}
			});
		}
	},
};