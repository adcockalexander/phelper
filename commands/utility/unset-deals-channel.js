const fs = require('node:fs');
const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unset-deals-channel')
		.setDescription('Removes a channel as a deals channel for moderation purposes')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    	.setDMPermission(false)
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to disable moderation in')
				.setRequired(true)),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel')

		if (!interaction.client.channelConfig[channel.id]) {
			await interaction.reply({ 
				content: ':x: This channel does not have deals moderation enabled!', 
				flags: MessageFlags.Ephemeral
			});
		} else {
			delete interaction.client.channelConfig[channel.id]

			fs.writeFile(interaction.client.channelConfigFileName, JSON.stringify(interaction.client.channelConfig), async err => {
				if (err) {
					console.error("Couldn't write channel config:", err);
					
					await interaction.reply({ 
						content: ':x: Something went wrong when trying to save channel configuration. Please tell Cloak!', 
						flags: MessageFlags.Ephemeral
					});
				} else {
					await interaction.reply({ 
						content: ':white_check_mark: *Disabled deals moderation in channel #' + channel.name + '*', 
						flags: MessageFlags.Ephemeral
					});
				}
			});
		}
	},
};