const fs = require('node:fs');
const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');

const XP_TYPE = 1
const ROLE_TYPE = 2

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create-code')
		.setDescription('Create a redemption code')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    	.setDMPermission(false)
		.addStringOption(option =>
			option.setName('type')
				.setDescription('The type of redemption code to create')
				.setRequired(true)
				.addChoices(
					{ name: 'XP', value: 'XP' },
					{ name: 'Role', value: 'Role' }
				))
		.addIntegerOption(option =>
			option.setName('codes')
				.setDescription('The number of codes to create (max 10 at a time)')
				.setRequired(true))
        .addRoleOption(option =>
            option.setName('role-id')
                .setDescription('(Optional) If this is a role code, what is the role?')
                .setRequired(false)),
	async execute(interaction) {
        var type = interaction.options.getString('type')
        const codes = interaction.options.getInteger('codes')
        const role = interaction.options.getRole('role-id')
        
        if (type == "Role" && Object.is(role, null)) {
            await interaction.reply({ 
                content: ':exclamation: You need to provide a role ID when making a role code!', 
                flags: MessageFlags.Ephemeral
            });
        } else if (type == "XP" && !Object.is(role, null)) {
            await interaction.reply({ 
                content: ':exclamation: You can\'t provide a role ID when making an XP code!', 
                flags: MessageFlags.Ephemeral
            });
        } else if (codes > 10) {
            await interaction.reply({ 
                content: ':exclamation: You can\'t make more than 10 codes at a time!', 
                flags: MessageFlags.Ephemeral
            });
        } else {
            var additionalText = ""

            if (type == "Role") {
                additionalText = "\n\nRole codes have been generated for role " + role.toString()
            }

            const codeResults = []

            for (var i = 0; i < codes; i++) {
                codeResults[i] = Array.from(Array(16), () => Math.floor(Math.random() * 36).toString(36)).join('').toUpperCase()
            }

            var textContent = ':white_check_mark: Generated ' + codes + ' ' + type + ' codes at the request of ' + interaction.member.toString() + '.\n'
            + 'Codes will be stored in the database until redeemed or deleted.' + additionalText + '\n\n'

            const db = interaction.client.codeDb

            db.serialize(() => {
                for (var i = 0; i < codes; i++) {
                    textContent = textContent + codeResults[i] + "\n"

                    db.run(`INSERT INTO codes(key, type, data) VALUES (?, ?, ?)`, codeResults[i], type == "XP" ? XP_TYPE : ROLE_TYPE, role.id)
                }
            })

            await interaction.reply({ 
                content: textContent
            });
        }
    },
};