const fs = require('node:fs');
const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');

const XP_TYPE = 1
const ROLE_TYPE = 2

module.exports = {
	data: new SlashCommandBuilder()
		.setName('view-codes')
		.setDescription('View the currently created codes')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    	.setDMPermission(false)
		.addStringOption(option =>
			option.setName('type')
				.setDescription('The type of redemption code to view')
				.setRequired(true)
				.addChoices(
					{ name: 'XP', value: 'XP' },
					{ name: 'Role', value: 'Role' }
				)),
	async execute(interaction) {
		var type = interaction.options.getString('type')

        var textContent = ':white_check_mark: Fetched all active ' + type + ' codes at the request of ' + interaction.member.toString() + '.\n\n'

        const db = interaction.client.codeDb

        await db.serialize(async () => {
            type = type == "XP" ? XP_TYPE : ROLE_TYPE 

            db.all("SELECT * FROM codes WHERE type = " + type, (err, rows) => {
                for (var row of rows) {
                    textContent = textContent + row.key + (type == ROLE_TYPE ? (' - ' + interaction.guild.roles.cache.get(row.data).toString()) : '') + '\n'
                }

                interaction.reply({ 
                    content: textContent
                })
            })
        })
	},
};