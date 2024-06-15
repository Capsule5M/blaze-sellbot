const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const QueryDb = require("../../events/QueryDb");
const { json } = require('express');

String.prototype.format = function() {
    var args = Array.from(arguments);
    return this.replace(/%s/g, function(match) {
        return args.shift();
    });
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("getsocietylist")
        .setDescription("Permets de recuperer la liste des societies.")
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Whether or not the reply should be ephemeral.').setRequired(true))
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ content: "Vous n'avez pas les permissions nécessaires pour cette commande !", ephemeral: true });

        const ephemeral = interaction.options.getBoolean('ephemeral');
        let resultUser;

        await QueryDb(`SELECT name, type FROM society`, function (result) {
            if (result.length > 0) {
                resultUser = result;
            }
        });

        const embed = new EmbedBuilder()
        .setColor(0x8200e9)
        .setTitle(`Informations sur les Orgas`)
        .setDescription("```json\n"+JSON.stringify(resultUser, null, 4)+"```")
        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
        .setTimestamp();

        await interaction.reply({ content: '', embeds: [embed], ephemeral: ephemeral});
    }
};