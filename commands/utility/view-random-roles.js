const fs = require('node:fs');
const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('view-random-roles')
		.setDescription('View the pool for Random Role redemption codes')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    	.setDMPermission(false),
	async execute(interaction) {
        var textContent = ':white_check_mark: Fetched the random role pool at the request of ' + interaction.member.toString() + '.\n\n'

        const db = interaction.client.codeDb

        await db.serialize(async () => {
            await db.all("SELECT * FROM gacha_roles", async (err, rows) => {
                for (var row of rows) {
                    const role = interaction.guild.roles.cache.get(row.role_id)

                    var roleString = "UNDEFINED - ROLE DELETED?"

                    if (role != undefined) {
                        roleString = role.toString()
                    }

                    textContent = textContent + roleString + " (" + row.tickets + " tickets)\n"
                }

                await interaction.reply({ 
                    content: textContent
                })
            })
        })
    },
};