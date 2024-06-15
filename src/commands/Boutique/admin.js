const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
accountsSchema = require('../../Schemas.js/accounts');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Admin tool !")
    .addUserOption(option => option.setName('user').setDescription('Le nom d\'utilisateur du compte donateur.').setRequired(false))
    .addStringOption(option => option.setName('email').setDescription('L\'email du compte donateur.').setRequired(false))
    .setDMPermission(false),
    async execute(interaction) {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({content: "Vous n'avez pas les permissions nécessaires pour cette commande !", ephemeral: true});

      const user = interaction.options.getUser('user');
      const email = interaction.options.getString('email');

      let userData;
      if (user) {
        userData = await accountsSchema.findOne({ discordID: user.id });
      } else if (email) {
        userData = await accountsSchema.findOne({ email: email });
      } else {
        return await interaction.reply({ content: 'Veuillez fournir un utilisateur ou un email.', ephemeral: true });
      }

      if (userData !== null) {
        const vipData = JSON.parse(userData.vip);
        const vipStatus = userData.vip === "null" ? '``Pas de VIP.``' : '``'+vipData.type+' - ``<t:'+Math.floor(new Date(vipData.expiration).getTime() / 1000)+':R>';
        const creatorStatus = (userData.creator && userData.creator !== 'null') ? userData.creator : 'Pas de code créateur lié.';
        const emailStatus = (userData.email && userData.email !== 'null') ? userData.email : 'Pas de mail lié.';
        const embed = new EmbedBuilder()
        .setColor(0x8200e9)
        .setTitle(`Compte de donation **[${user ? user.username : userData.discordID}]**`)
        .setDescription('**Numero de compte :** <@'+userData.discordID+'>\n**Email :** `'+emailStatus+'`\n**VIP :** '+vipStatus+'\n**Createur : **`'+creatorStatus+'`\n**Vos Diamands <a:diamondmodern:1209541241524584528> :** `'+userData.coins+'`')
        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
        .setTimestamp();
        const row1 = new ActionRowBuilder()
        if (userData.active === true) {
          row1.addComponents(
            new ButtonBuilder()
            .setCustomId('disabl'+userData.discordID)
            .setLabel('Desactiver')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1210216662322909214'),
            new ButtonBuilder()
            .setCustomId('addcoins'+userData.discordID)
            .setLabel('Add Diamands')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1209541241524584528'),
            new ButtonBuilder()
            .setCustomId('removeco'+userData.discordID)
            .setLabel('Remove Diamands')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1209541241524584528'),
          );
        } else {
          row1.addComponents(
            new ButtonBuilder()
            .setCustomId('enable'+userData.discordID)
            .setLabel('Reactiver')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1210216662322909214'),
            new ButtonBuilder()
            .setCustomId('addcoins'+userData.discordID)
            .setLabel('Add Diamands')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1209541241524584528'),
            new ButtonBuilder()
            .setCustomId('removeco'+userData.discordID)
            .setLabel('Remove Diamands')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1209541241524584528'),
          );
        }
        const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('cgvip'+userData.discordID)
            .setLabel('Changer VIP')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1083824500535214101'),
            new ButtonBuilder()
            .setCustomId('cgcreator'+userData.discordID)
            .setLabel('Changer createur')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1005550287764856922'),
            new ButtonBuilder()
            .setCustomId('cgmail'+userData.discordID)
            .setLabel('Changer mail')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📬'),
        );
        await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
      } else {
        await interaction.reply({ content: 'Pas de compte donateur pour cet utilisateur !', ephemeral: true });
      }
    }
}
