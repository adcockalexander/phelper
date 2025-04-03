const fs = require('node:fs');
const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');

const XP_TYPE = 1
const ROLE_TYPE = 2
const GACHA_TYPE = 3

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create-custom-code')
		.setDescription('Create a custom redemption code, where you specify the redemption key')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    	.setDMPermission(false)
		.addStringOption(option =>
			option.setName('type')
				.setDescription('The type of redemption code to create')
				.setRequired(true)
				.addChoices(
					{ name: 'XP', value: 'XP' },
					{ name: 'Role', value: 'Role' },
                    { name: 'Random Role', value: 'Random Role' }
				))
		.addStringOption(option =>
			option.setName('key')
				.setDescription('What should the redemption key be? (1-32 characters)')
				.setRequired(true))
        .addRoleOption(option =>
            option.setName('role-id')
                .setDescription('(Optional) If this is a role code, what is the role?')
                .setRequired(false)),
	async execute(interaction) {
        var type = interaction.options.getString('type')
        const key = interaction.options.getString('key').toUpperCase()
        const role = interaction.options.getRole('role-id')
        
        if (type == "Role" && Object.is(role, null)) {
            await interaction.reply({ 
                content: ':exclamation: You need to provide a role ID when making a role code!', 
                flags: MessageFlags.Ephemeral
            });
        } else if ((type == "XP" || type == "Random Role") && !Object.is(role, null)) {
            await interaction.reply({ 
                content: ':exclamation: You can\'t provide a role ID when making an XP or Random Role code!', 
                flags: MessageFlags.Ephemeral
            });
        } else if (key.length < 1) {
            await interaction.reply({ 
                content: ':exclamation: Your redemption key is empty!', 
                flags: MessageFlags.Ephemeral
            });
        } else if (key.length > 32) {
            await interaction.reply({ 
                content: ':exclamation: Your key is too long (max 32 characters)!', 
                flags: MessageFlags.Ephemeral
            });
        } else {
            var additionalText = ""

            if (type == "Role") {
                additionalText = "\n\nRole code has been generated for role " + role.toString()
            }

            var textContent = ':white_check_mark: Generated a custom ' + type + ' code at the request of ' + interaction.member.toString() + '.\n'
            + 'Code will be stored in the database until redeemed or deleted.' + additionalText + '\n\n'

            const db = interaction.client.codeDb

            db.serialize(() => {
                textContent = textContent + key

                db.run(`INSERT INTO codes(key, type, data) VALUES (?, ?, ?)`, key, type == "XP" ? XP_TYPE : ROLE_TYPE, (role == null) ? null : role.id)
            })

            await interaction.reply({ 
                content: textContent
            });
        }
    },
};