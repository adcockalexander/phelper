const fs = require('node:fs');
const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add-random-role')
		.setDescription('Add a role to the pool for Random Role redemption codes')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    	.setDMPermission(false)
        .addRoleOption(option =>
            option.setName('role-id')
                .setDescription('The role to add')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('tickets')
                .setDescription('The number of tickets in the pool for this role')
                .setRequired(true)),
	async execute(interaction) {
        const role = interaction.options.getRole('role-id')
        const tickets = interaction.options.getInteger('tickets')

        if (tickets < 1) {
            await interaction.reply({ 
                content: ':exclamation: The role must have at least 1 ticket!', 
                flags: MessageFlags.Ephemeral
            });
        } else {
            const db = interaction.client.codeDb

            var foundRoleInPool = false

            await db.serialize(async () => {
                var stmt = db.prepare("SELECT * FROM gacha_roles WHERE role_id = ?")

                await stmt.each(role.id, async function(err, row) {
                    foundRoleInPool = true
                })
            })

            if (foundRoleInPool) {
                await interaction.reply({ 
                    content: ':exclamation: This role already exists in the pool!', 
                    flags: MessageFlags.Ephemeral
                })
            } else {
                db.serialize(() => {
                    db.run(`INSERT INTO gacha_roles(role_id, tickets) VALUES (?, ?)`, role.id, tickets)
                })

                var textContent = ':white_check_mark: Added ' + role.toString() + ' (' + tickets + ' tickets) to the random role pool at the request of ' + interaction.member.toString() + '.\n'

                await interaction.reply({ 
                    content: textContent
                });
            }
        }
    },
};