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
        .setName("getcoffre")
        .setDescription("Permets de recuperer les informations d'un coffre.")
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Whether or not the reply should be ephemeral.').setRequired(true))
        .addStringOption(option => option.setName('plaque').setDescription('La plaque d\'un vehicule.').setRequired(false))
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ content: "Vous n'avez pas les permissions nécessaires pour cette commande !", ephemeral: true });

        const plaque = interaction.options.getString('plaque');
        const ephemeral = interaction.options.getBoolean('ephemeral');
        let resultUser;

        if (plaque) {
            await QueryDb(`SELECT * FROM users_vehicles_inventory WHERE plate='${plaque}'`, function (result) {
                if (result.length > 0) {
                    resultUser = result;
                }
            });
        } else {
            return await interaction.reply({ content: 'Veuillez fournir une plaque de vehicule.', ephemeral: true });
        } 

        if (resultUser !== null) {

            const embed = new EmbedBuilder()
            .setColor(0x8200e9)
            .setTitle(`Informations de la plaque ${plaque}`)
            .setDescription("```json\n"+JSON.stringify(resultUser, null, 4)+"```")
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
            .setTimestamp();

            await interaction.reply({ content: '', embeds: [embed], ephemeral: ephemeral});
        } else {
            await interaction.reply({ content: 'Aucun coffre trouvé.', ephemeral: true });
        }
    }
};