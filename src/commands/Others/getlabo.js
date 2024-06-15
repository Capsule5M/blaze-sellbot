const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const QueryDb = require("../../events/QueryDb");
const { json } = require('express');
require('dotenv').config();

String.prototype.format = function() {
    var args = Array.from(arguments);
    return this.replace(/%s/g, function(match) {
        return args.shift();
    });
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("getlabo")
        .setDescription("Permets de recuperer un labo.")
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Whether or not the reply should be ephemeral.').setRequired(true))
        .addStringOption(option => option.setName('labo').setDescription('Nom du labo.').setRequired(false))
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ content: "Vous n'avez pas les permissions nécessaires pour cette commande !", ephemeral: true });

        const labo = interaction.options.getString('labo');
        const ephemeral = interaction.options.getBoolean('ephemeral');
        let resultUser;

        if (labo) {
            await QueryDb(`SELECT data FROM orga_laboratory WHERE name='${labo}'`, function (result) {
                if (result.length > 0) {
                    resultUser = result;
                }
            });
        } else {
            return await interaction.reply({ content: 'Veuillez fournir un nom de labo.', ephemeral: true });
        } 

        if (resultUser !== null) {
            const embed = new EmbedBuilder()
            .setColor(0x8200e9)
            .setTitle(`Informations sur les Labos`)
            .setDescription("```json\n"+JSON.stringify(resultUser, null, 4)+"```")
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
            .setTimestamp();

            await interaction.reply({ content: '', embeds: [embed], ephemeral: ephemeral});
        } else {
            await interaction.reply({ content: 'Aucun labo trouvé.', ephemeral: true });
        }
    }
};