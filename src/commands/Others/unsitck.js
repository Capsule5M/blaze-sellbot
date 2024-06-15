const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const stickySchema = require("../../Schemas.js/sticky");
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
    .setName("unstick")
    .setDescription("Unsticks a current sticky message.")
    .setDMPermission(false),
    async execute (interaction) {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({content: "Vous n'avez pas les permissions nécessaires pour cette commande !", ephemeral: true});


        const data = await stickySchema.findOne({ ChannelID: interaction.channel.id });

        if (!data) {
            return await interaction.reply({content: "There is no sticky message in this channel!", ephemeral: true});

        } else {
            try {
                interaction.client.channels.cache.get(interaction.channel.id).messages.fetch(data.LastMessageID).then(async(m) => {
                    await m.delete();
                });
            } catch {
                return;
            }

        }

        stickySchema.deleteMany({ ChannelID: interaction.channel.id }, async (err, data) => {
            if (err) throw err;
            await interaction.reply({content: "The sticky message has been removed!", ephemeral: true});
        });
    }
}


