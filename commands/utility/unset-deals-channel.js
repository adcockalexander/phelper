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

					await interaction.reply({ 
						content: textContent + ':white_check_mark: Disabled deals moderation in channel ' + channel.toString() + ' at the request of ' + interaction.member.toString() + '.'
					});
				}
			});
		}
	},
};