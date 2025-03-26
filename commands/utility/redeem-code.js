const fs = require('node:fs');
const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');

const XP_TYPE = 1
const ROLE_TYPE = 2

const XP_ROLE = '1354255782211879032'

module.exports = {
	data: new SlashCommandBuilder()
		.setName('redeem-code')
		.setDescription('Redeem a code')
    	.setDMPermission(false)
		.addStringOption(option =>
			option.setName('key')
				.setDescription('The redemption code key')
				.setRequired(true)),
	async execute(interaction) {
        var key = interaction.options.getString('key')

        const db = interaction.client.codeDb

        await db.serialize(async () => {
            var stmt = db.prepare("SELECT * FROM codes WHERE key = ?")

            stmt.each(key, function(err, row) {
                if (row.type == XP_TYPE) {
                    const xpRole = interaction.guild.roles.cache.get(XP_ROLE)

                    if (xpRole == undefined) {
                        interaction.reply({ 
                            content: ':exclamation: The XP role doesn\'t seem to exist! Can\'t continue, contact an admin', 
                            flags: MessageFlags.Ephemeral
                        })
                    } else {
                        interaction.member.roles.add(xpRole)

                        interaction.reply({ 
                            content: ':white_check_mark: Redeemed XP code!', 
                            flags: MessageFlags.Ephemeral
                        })
                    }
                } else if (row.type == ROLE_TYPE) {
                    const newRole = interaction.guild.roles.cache.get(row.data)

                    if (newRole == undefined) {
                        interaction.reply({ 
                            content: ':exclamation: The role doesn\'t seem to exist anymore! Can\'t continue, contact an admin', 
                            flags: MessageFlags.Ephemeral
                        })
                    } else {
                        interaction.member.roles.add(newRole)

                        interaction.reply({ 
                            content: ':white_check_mark: Redeemed Role code for ' + interaction.guild.roles.cache.get(row.data).toString() + '!', 
                            flags: MessageFlags.Ephemeral
                        })
                    }
                }
            }, function(err, count) {
                stmt.finalize()

                if (count == 0) {
                    interaction.reply({ 
                        content: ':exclamation: This code isn\'t valid!', 
                        flags: MessageFlags.Ephemeral
                    })
                } else {
                    db.run('DELETE FROM codes WHERE key = ?', key)
                }
            })
        })
	},
};