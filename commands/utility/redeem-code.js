const fs = require('node:fs');
const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');

const XP_TYPE = 1
const ROLE_TYPE = 2
const GACHA_TYPE = 3

const XP_ROLE = '1353239370332766269'

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
        var key = interaction.options.getString('key').toUpperCase()

        const db = interaction.client.codeDb

        db.serialize(() => {
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

                        db.run('DELETE FROM codes WHERE key = ?', key)
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

                        db.run('DELETE FROM codes WHERE key = ?', key)
                    }
                } else if (row.type == GACHA_TYPE) {
                    db.all("SELECT * FROM gacha_roles", async (err, rows) => {
                        var totalTickets = 0

                        for (var row of rows) {
                            totalTickets += row.tickets
                        }

                        var remainingTickets = Math.floor(Math.random() * totalTickets) + 1

                        for (var row of rows) {
                            remainingTickets -= row.tickets

                            if (remainingTickets <= 0) {
                                const newRole = interaction.guild.roles.cache.get(row.role_id)

                                if (newRole == undefined) {
                                    interaction.reply({ 
                                        content: ':exclamation: The role you received doesn\'t seem to exist anymore! Code has not been redeemed - contact an admin', 
                                        flags: MessageFlags.Ephemeral
                                    })
                                    
                                    return
                                } else {
                                    db.all("SELECT * FROM gacha_role_users WHERE user_id = ? AND role_id = ?", interaction.member.id, row.role_id, async (err, rows) => {
                                        if (rows.length > 0) {
                                            interaction.reply({ 
                                                content: ':warning: You received ' + newRole.toString() + ', but you already have this! Code has not been redeemed - try again!', 
                                                flags: MessageFlags.Ephemeral
                                            })
                                        } else {
                                            db.run("INSERT INTO gacha_role_users(user_id, role_id) VALUES(?, ?)", interaction.member.id, row.role_id)

                                            interaction.reply({ 
                                                content: ':tada: ' + interaction.member.toString() + ' just received ' + newRole.toString() + ' from a Random Role code! Congratulations! \nUse `/equip-role` to equip your new role!'
                                            })

                                            db.run('DELETE FROM codes WHERE key = ?', key)
                                        }
                                    })

                                    return
                                }
                            }
                        }
                    })
                }
            }, async function(err, count) {
                stmt.finalize()

                if (count == 0) {
                    interaction.reply({ 
                        content: ':exclamation: This code isn\'t valid!', 
                        flags: MessageFlags.Ephemeral
                    })
                    
                    return
                }
            })
        })
	},
};