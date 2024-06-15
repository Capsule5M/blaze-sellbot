const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
accountsSchema = require('../../Schemas.js/accounts');
const axios = require('axios');
const QueryDb = require("../../events/QueryDb");
const { json } = require('express');
const txAdmin = require("../../events/txAdmin")
require('dotenv').config();

String.prototype.format = function() {
    var args = Array.from(arguments);
    return this.replace(/%s/g, function(match) {
        return args.shift();
    });
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("getplayer")
        .setDescription("Permets de recuperer les informations d'un joueurs.")
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Whether or not the reply should be ephemeral.').setRequired(true))
        .addUserOption(option => option.setName('user').setDescription('Le nom d\'utilisateur du joueurs.').setRequired(false))
        .addStringOption(option => option.setName('license').setDescription('La license du joueurs.').setRequired(false))
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ content: "Vous n'avez pas les permissions nécessaires pour cette commande !", ephemeral: true });

        const user = interaction.options.getUser('user');
        const license = interaction.options.getString('license');
        const ephemeral = interaction.options.getBoolean('ephemeral');
        const cookie = txAdmin.getCookie();
        const csrfToken = txAdmin.getCsrfToken();
        let resultUser;

        if (user) {
            await QueryDb(`SELECT * FROM USERS WHERE discordId='${user.id}'`, function (result) {
                if (result.length > 0) {
                    resultUser = result[0];
                }
            });
        } else if (license) {
            await QueryDb(`SELECT * FROM USERS WHERE license='${license}'`, function (result) {
                if (result.length > 0) {
                    resultUser = result[0];
                }
            });
        } else {
            return await interaction.reply({ content: 'Veuillez fournir un utilisateur ou une license.', ephemeral: true });
        }
        if (resultUser !== null) {
            const response = await axios.get('http://127.0.0.1:40120/player?license=' + resultUser.identifier + '', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json; charset=UTF-8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'x-txadmin-csrftoken': csrfToken,
                    'cookie': cookie
                },
            });
            const player = response.data.player;
            const actionHistory = player["actionHistory"];
            const accounts = JSON.parse(resultUser.accounts)
            const chaine = "**Actuellement connecter :** %s\n**Temps de jeux total :** %s heure(s)\n**ID Perm :** %s\n**License :** %s\n**Nom & Prénom RP :** %s %s\n**Exp :** %s\n**Groupe :** %s\n**Liquide :** %s$\n**Argent sale :** %s$\n**Banque :** %s$\n**Inventaire :** ```json\n%s```\n**Armes :** ```json\n%s```\n**Job / Grade :** %s [%s]\n**Orga / Grade :** %s [%s]\n**Clés véhicule :** ```json\n%s```".format(player.isConnected && "Oui" || "Non", player.playTime/60, resultUser.permid, resultUser.identifier, resultUser.lastname, resultUser.firstname, resultUser.exp, resultUser.group, accounts.money, accounts.black_money, accounts.bank, resultUser.inventory, resultUser.weapons, resultUser.job, resultUser.job_grade, resultUser.orga, resultUser.orga_grade, resultUser.vehicle_keys)

            const embed = new EmbedBuilder()
            .setColor(0x8200e9)
            .setTitle(`Informations du joueur ${resultUser.firstname} ${resultUser.lastname}`)
            .setDescription(chaine)

            const embed2 = new EmbedBuilder()
            .setColor(0x8200e9)
            .setTitle(`Historique d'action de ${resultUser.firstname} ${resultUser.lastname}`)
            .setDescription("```json\n"+JSON.stringify(actionHistory, null, 4)+"```")
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
            .setTimestamp();

            await interaction.reply({ content: '', embeds: [embed, embed2], ephemeral: ephemeral});
        } else {
            await interaction.reply({ content: 'Aucun joueur trouvé.', ephemeral: true });
        }
    }
};