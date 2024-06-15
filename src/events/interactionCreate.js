require('dotenv').config();
const { Interaction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return
        
        try{
            const cmd = await command.execute(interaction, client);
        } catch (error) {
            console.log(error);
            await interaction.reply({
                content: 'There was an error while executing this command!', 
                ephemeral: true
            });

            // error flag system
            var guild = interaction.guild;
            var member = interaction.member;
            var channel = interaction.channel;
            var errorTime = `<t:${Math.floor(Date.now() / 1000)}:R>`;

            const sendChannel = await client.channels.fetch(process.env.LOGS_CHANNEL);

            const embed = new EmbedBuilder()
            .setColor(0x8200e9)
            .setTitle("Flagged Error!")
            .setDescription("An error occured while executing a slash command. All other forms of interactions will not be logged.")
            .addFields({name: "Error Command", value:`\`${interaction.commandName}\``})
            .addFields({name: "Error Stack", value:`\`${error.stack}\``})
            .addFields({name: "Error Message", value:`\`${error.message}\``})
            .addFields({name: "Error Timestamp", value:`${errorTime}`})
            .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
            .setTimestamp();

            const button = new ButtonBuilder()
            .setCustomId('fechtErrorUserInfo')
            .setLabel('Fetch User Info')
            .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder()
            .addComponents(button);

            const msg = await sendChannel.send({embeds: [embed], components: [row]}).catch(err => {});

            var time = 30000;
            const collector = await msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time
            });

            collector.on('collect', async i => {
                if (i.customid == 'fechtErrorUserInfo') {
                    const userEmbed = new EmbedBuilder()
                    .setColor(0x8200e9)
                    .setDescription("This user has triggered a slash command eror while using one of the commands in the server.")
                    .addFields({name: "Error Guild", value:`\`${guild.name} (${guild.id})\``})
                    .addFields({name: "Error User", value:`\`${member.user.username} (${member.id})\``})
                    .addFields({name: "Error Channel", value:`\`${channel.name} (${channel.id})\``})
                    .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
                    .setTimestamp();

                    await i.reply({embeds: [userEmbed], ephemeral: true});
                }
            });

            collector.on('end', async () => {
               button.setDisabled(true);
               embed.setFooter({ text: 'Error flag system -- your user fetch button has expired' });
               await msg.edit({embeds: [embed], components: [row]}); 
            });
        } 

    },
    


};