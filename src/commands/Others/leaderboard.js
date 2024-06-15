const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
accountsSchema = require('../../Schemas.js/accounts');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("classement")
    .setDescription("Permet de voir le classement des TOP 10 contributeurs sur Modern.")
    .setDMPermission(false),
    async execute(interaction) {
      const queryResult = await accountsSchema.find().sort({total: -1}).limit(10);
      const resultArray = queryResult.map(doc => [doc.discordID, doc.total]);
      let leaderBlist = "";
      let value = 0;
      // Print the IDs on separate lines
      for (const [discordID, total] of resultArray) {
        value++;
        leaderBlist += `${value}. <@${discordID}> ${total} <a:diamondmodern:1209541241524584528>\n`;
      }
      const des = leaderBlist;
      const embed = new EmbedBuilder()
        .setTitle('Classement des TOP 10 Contributeurs')
        .setDescription(des)
        .setColor(0x8200e9)
        .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
}