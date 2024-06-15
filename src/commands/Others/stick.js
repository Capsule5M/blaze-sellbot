const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const stickySchema = require("../../Schemas.js/sticky");
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
    .setName("stick")
    .setDescription("Sticky a message to a channel.")
    .addStringOption(option => option.setName('message').setDescription('The message to stick').setRequired(true))
    .addNumberOption(option => option.setName('count').setDescription('The maximum count of the sticky message').setRequired(false))
    .setDMPermission(false),
    async execute (interaction) {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({content: "Vous n'avez pas les permissions nécessaires pour cette commande !", ephemeral: true});

        let string = interaction.options.getString('message');
        let amount = interaction.options.getNumber('count') || 6;

        const embed = new EmbedBuilder()
        .setColor(0x8200e9)
        .setDescription(string)
        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
        .setTimestamp();

        stickySchema.findOne({ ChannelID: interaction.channel.id }, async (err, data) => {
            if (err) throw err;
            if (!data) {
                let msg = await interaction.channel.send({embeds: [embed]});

                stickySchema.create({
                    Message: string,
                    ChannelID: interaction.channel.id,
                    LastMessageID: msg.id,
                    MaxCount: amount,
                });

                return await interaction.reply({content: "The message has been stickied!", ephemeral: true});
            } else {
                await interaction.reply({content: "There is already a sticky message in this channel!", ephemeral: true});
            }
        });
    }
}


