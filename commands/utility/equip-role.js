const fs = require('node:fs');
const { SlashCommandBuilder, MessageFlags, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('equip-role')
		.setDescription('Equip a role')
    	.setDMPermission(false),
	async execute(interaction) {
        const db = interaction.client.codeDb

        db.serialize(() => {
            db.all("SELECT * FROM gacha_role_users WHERE user_id = ?", interaction.member.id, async (err, rows) => {
                if (rows.length == 0) {
                    await interaction.reply({ 
                        content: ':warning: You haven\'t unlocked any roles yet!', 
                        flags: MessageFlags.Ephemeral
                    })
                } else {
                    const buttons = new ActionRowBuilder()

                    for (var row of rows) {
                        const role = interaction.guild.roles.cache.get(row.role_id)

                        if (role == undefined) {
                            continue
                        } else {
                            const button = new ButtonBuilder()
                                .setCustomId(row.role_id)
                                .setLabel(role.name)
                                .setStyle(ButtonStyle.Primary)

                            buttons.addComponents(button)
                        }
                    }

                    const response = await interaction.reply({
                        content: 'Which role would you like to equip?',
                        components: [buttons],
                        withResponse: true,
                        flags: MessageFlags.Ephemeral
                    })

                    const collectorFilter = i => i.user.id === interaction.user.id;
                    try {
                        const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

                        db.all("SELECT * FROM gacha_role_users WHERE user_id = ? AND role_id = ?", interaction.member.id, confirmation.customId, async (err, rowsTwo) => {
                            if (rowsTwo.length == 0) {
                                await interaction.editReply({ content: ':x: You don\'t own the role selected - is this an exploit?', components: [] });
                            } else {
                                for (var row of rows) {
                                    if (row.role_id == confirmation.customId) {
                                        continue
                                    }

                                    const role = interaction.guild.roles.cache.get(row.role_id)

                                    interaction.member.roles.remove(role)
                                }

                                const role = interaction.guild.roles.cache.get(confirmation.customId)

                                interaction.member.roles.add(role)

                                await interaction.editReply({ content: ':white_check_mark: Equipped ' + role.toString(), components: [] });
                            }
                        })
                    } catch {
                        await interaction.editReply({ content: ':x: Cancelling - no role chosen', components: [] });
                    }
                }
            })
        })
	},
};