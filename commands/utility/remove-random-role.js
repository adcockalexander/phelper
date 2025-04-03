const fs = require('node:fs');
const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove-random-role')
		.setDescription('Remove a role from the pool for Random Role redemption codes')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    	.setDMPermission(false)
        .addRoleOption(option =>
            option.setName('role-id')
                .setDescription('The role to remove')
                .setRequired(true)),
	async execute(interaction) {
        const role = interaction.options.getRole('role-id')

        const db = interaction.client.codeDb

        db.serialize(async () => {
            db.all("SELECT * FROM gacha_roles WHERE role_id = ?", role.id, async (err, rows) => {
                if (rows.length > 0) {
                    db.serialize(() => {
                        db.run(`DELETE FROM gacha_roles WHERE role_id = ?`, role.id)
                    })
        
                    var textContent = ':white_check_mark: Removed ' + role.toString() + ' from the random role pool at the request of ' + interaction.member.toString() + '.\n'
        
                    await interaction.reply({ 
                        content: textContent
                    });
                } else {
                    await interaction.reply({ 
                        content: ':exclamation: This role doesn\'t exist in the pool!', 
                        flags: MessageFlags.Ephemeral
                    })
                }
            })
        })
    },
};