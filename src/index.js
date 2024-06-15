require('dotenv').config();
const { Client, ModalBuilder, TextInputBuilder, TextInputStyle, Events, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, MessageManager, Embed, Collection, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ActivityType, ChannelType, GuildFeature, CommandInteractionOptionResolver } = require(`discord.js`);
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const validator = require('validator');
const fs = require('fs');
const url = require('url');
client.commands = new Collection();
client.buttons = new Collection();
const express = require("express");
const app = express()
const orderSchema = require('./Schemas.js/orders');
const pnlSchema =  require("./Schemas.js/pnl");
const accountsSchema =  require("./Schemas.js/accounts");
const creatorSchema =  require("./Schemas.js/creator");
const stickySchema = require("./Schemas.js/sticky");
const { default: axios } = require('axios');
const { send } = require('process');
const QueryDb = require("./events/QueryDb")

const jsonData = {};
const manualOrderData = {};
const isAlreadyInOrder = {};
const isAlreadyInAction = {};
module.exports = client;

// ############################################################################################################ Bot Init Functions ############################################################################################################

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./src/commands");

process.on('unhandledRejection', async (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.error('Uncaught Exception Monitor:', err, origin);
});

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleCommands(commandFolders, "./src/commands");
    client.login(process.env.token)
})();

// ############################################################################################################ Diamands Map ############################################################################################################

const storeItems = new Map([
  [1, { price: 10, priceInCents: 1000, name: "1000 Diamands", iscoin: true}],
  [2, { price: 25, priceInCents: 2500, name: "2500 Diamands", iscoin: true}],
  [3, { price: 50, priceInCents: 5000, name: "5000 Diamands", iscoin: true}],
  [4, { price: 100, priceInCents: 12000, name: "12000 Diamands", iscoin: true}],
  [5, { price: 200, priceInCents: 25000, name: "25000 Diamands", iscoin: true}],
  [6, { price: 25, priceInCents: 2500, name: "VIP Bronze", iscoin: false}],
  [7, { price: 50, priceInCents: 5000, name: "VIP Argent", iscoin: false}],
  [8, { price: 100, priceInCents: 10000, name: "VIP Or", iscoin: false}],
  [9, { price: 120, priceInCents: 12000, name: "VIP Platinium", iscoin: false}],
])

async function logAction(description) {
  const channel = client.channels.cache.get("1083809217498075176");
  const embed = new EmbedBuilder()
    .setTitle("ShopBot - Log d'actions")
    .setDescription(description)
    .setColor(0x8200e9)
    .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
    .setTimestamp();
  await channel.send({ embeds: [embed] });
}

setInterval(checkVipExpiration, 1000 * 60 * 60); // Check every hour

async function checkVipExpiration() {
  console.log("Checking VIP expiration")
  const currentDate = new Date();
  const accounts = await accountsSchema.find({});
  for (const account of accounts) {
    if (account.vip !== "null" && JSON.parse(account.vip).expiration && new Date(JSON.parse(account.vip).expiration) < currentDate) {
      const vip = JSON.parse(account.vip);
      await logAction('User: <@'+account.discordID+'>\nType: ``VIP Expiration``\nExpiration: <t:'+Math.floor(new Date(vip.expiration).getTime() / 1000)+':R>');
      account.vip = "null";
      await account.save();
    }
  }
}

// ############################################################################################################ Message Create ############################################################################################################


client.on(Events.MessageCreate, async message => {

  if (message.author.bot && message.author.id == '695664615534755850' || message.author.id == '1070689080188346368') {
    if (message.content.startsWith('?claim')) {
      const userId = message.content.split(' ')[1];
      const iscoin = message.content.split(' ')[2];
      const TXID = message.content.split(' ')[3];
      await getCoins(userId);
      if (!isNaN(iscoin)) {
        const Amount = parseInt(iscoin);
        await GenerateCoins(Amount, userId);
        await sendMessageToUser2(userId, Amount, TXID);
      } else if (['vipbronze', 'vipor', 'vipargent', 'vipplatinum'].includes(iscoin.toLowerCase())) {
        const vipLevels = { "vipbronze": 1, "vipargent": 2, "vipor": 3, "vipplatinum": 4 };
        const vipType = { "vipbronze": "VIP Bronze", "vipargent": "VIP Argent", "vipor": "VIP Or", "vipplatinum": "VIP Platinium" };
        const vip_level = vipLevels[iscoin.toLowerCase()] || null;
        const vip_type = vipType[iscoin.toLowerCase()] || null;
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        QueryDb(`INSERT INTO users_vip (discordId, vip_level, expiration) VALUES ('${userId}', '${vip_level}', '${expirationDate.toISOString().slice(0, 10)}') ON DUPLICATE KEY UPDATE vip_level = VALUES(vip_level), expiration = VALUES(expiration)`, async function(result) {
          if (result.affectedRows > 0) {
            await accountsSchema.findOneAndUpdate({ discordID: userId }, { $set: { vip: JSON.stringify({ type: vip_type, expiration: expirationDate.toISOString().slice(0, 10) }) } });
            const sendDate = expirationDate.toISOString().slice(0, 10)
            sendMessageToUser4(userId, TXID, vip_type, sendDate);
            await logAction('User: <@'+userId+'>\n User ID: ``'+userId+'``\n Payment ID: ``'+TXID+'``\n VIP Type: ``'+vip_type+'``\n Expiration: ``'+expirationDate.toISOString().slice(0, 10)+'``\n Type: ``Tebex``')
          } else {
            await logAction('User: <@'+userId+'>\n User ID: ``'+userId+'``\n Payment ID: ``'+TXID+'``\n VIP Type: ``'+vip_type+'``\n Expiration: ``'+expirationDate.toISOString().slice(0, 10)+'``\n Type: ``Tebex Error``')
          }
        });
      }
      await message.reply({content: ':white_check_mark:'});
    }
  } else {
    console.log(message.webhookId, message.channel.id);
    stickySchema.findOne({ ChannelID: message.channel.id }, async (err, data) => {
      if (err) throw err;

      if (!data) {
        return;
      }

      let channel = data.ChannelID;
      let cachedChannel = client.channels.cache.get(channel);

      const embed = new EmbedBuilder()
      .setTitle('Message Sticky 📌')
      .setDescription(data.Message)
      .setColor(0x8200e9)
      .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
      .setTimestamp();

      if (message.channel.id == channel) {
        data.CurrentCount += 1;
        data.save();

        if (data.CurrentCount >= data.MaxCount) {
          try {
            await client.channels.cache.get(channel).messages.fetch(data.LastMessageID).then(async(m) => {
              await m.delete();
            });

            let newMessage = await cachedChannel.send({embeds: [embed]});

            data.LastMessageID = newMessage.id;
            data.CurrentCount = 0;
            data.save();
          } catch {
            return;
          }
        }
      }

    });
  };
});

// ############################################################################################################ Modal Collector ############################################################################################################

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isModalSubmit()) return;
  if (interaction.customId.startsWith('manualinput')) {
    isAlreadyInOrder[interaction.user.id] = true;
	  const code = interaction.fields.getTextInputValue('codepcs');
	  const amount = interaction.fields.getTextInputValue('amountcode');
    await interaction.reply({ content: `Nous avons bien reçu votre commande, vous serez MP par le bot une fois qu'un staff l'aura validé ! (Garde tes MP ouverts !)`, ephemeral: true });
    const parsedData = JSON.parse(manualOrderData[interaction.user.id]);
    const row = new ActionRowBuilder()
		.addComponents(
				new ButtonBuilder()
					.setCustomId('accept'+interaction.user.id)
					.setLabel('Valider')
					.setStyle(ButtonStyle.Success),
        new ButtonBuilder()
					.setCustomId('reject'+interaction.user.id)
					.setLabel('Refuser')
					.setStyle(ButtonStyle.Danger),
		);

      const embed = new EmbedBuilder()
			.setColor(0x8200e9)
			.setTitle('Nouvelle Transaction Manuelle.')
			.setDescription(' \nInformations sur la commande: \n\n ``'+manualOrderData[interaction.user.id]+'`` \n\n Discord User Tag: <@'+interaction.user.id+'> \n\n Code PCS/PaysafeCard: `'+code+'` \n\n Montant en €: `'+amount+'` \n\n Vrais Montant en €: `'+parsedData.coins/100+'` ');

    await client.channels.cache.get(process.env.PAYSAFE).send({components: [row], embeds:[embed]});
    await client.channels.cache.get(process.env.PAYSAFE).send({content: process.env.PAYSAFE_PING});
    await logAction('User: <@'+interaction.user.id+'>\nMontant: ``'+amount+'``\nData: ``'+manualOrderData[interaction.user.id]+'``\nType: ``Commande Manuelle``')
  } else if (interaction.customId.startsWith('adminMailModal')) {
    const userId = interaction.customId.substring(14);
    const mail = interaction.fields.getTextInputValue('adminMailCode');
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    const isRealMail = emailRegex.test(mail);
    if (isRealMail) {
      await accountsSchema.findOneAndUpdate({ discordID: userId }, { $set: { email: mail } });
      const embed = new EmbedBuilder()
        .setTitle('Changement de mail')
        .setDescription('Le mail de <@'+userId+'> a été mis à jour. Nouveau mail : `'+mail+'`.')
        .setColor(0x8200e9);
      await interaction.update({ embeds: [embed], components:[], ephemeral: true });
      await logAction('Admin: <@'+interaction.user.id+'>\n User: <@'+userId+'>\n Mail: ``'+mail+'``\n Type: ``Change Mail``')
    } else {
      const embed = new EmbedBuilder()
        .setTitle('Changement de mail')
        .setDescription('Le mail que vous avez entré pour <@'+userId+'> est invalide. Veuillez entrer un mail valide.')
        .setColor("Red");
      await interaction.update({ embeds: [embed], components:[], ephemeral: true });
    }
  } else if (interaction.customId.startsWith('removeCoinsModal') || interaction.customId.startsWith('addCoinsModal')) {
    let userID;
    let amount;
    if (interaction.customId.startsWith('removeCoinsModal')) {
      userID = interaction.customId.substring(16);
      amount = interaction.fields.getTextInputValue('removeCoinsAmount');
    } else {
      userID = interaction.customId.substring(13);
      amount = interaction.fields.getTextInputValue('addCoinsAmount');
    }
    const tokensNumber = Number(amount);
    if (isNaN(tokensNumber) || !Number.isInteger(tokensNumber) || Math.sign(tokensNumber) !== 1) {
      const embed = new EmbedBuilder()
      .setDescription("Le nombre de token que vous avez entrée n'est pas valide. Veuillez réessayer le processus d'ajout et entrer un chiffre positif valide.")
      .setColor("Red");
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      const userAccount = await accountsSchema.findOne({ discordID: userID });
      if (interaction.customId.startsWith('removeCoinsModal')) {
        if (parseInt(tokensNumber) > parseInt(userAccount.coins)) {
          const embed = new EmbedBuilder()
            .setTitle('Retrait de Diamands')
            .setDescription('Le compte de <@'+userID+'> n\'as pas assez de '+process.env.COIN_NAME+' (`'+userAccount.coins+'`) pour satisfaire votre demande de retrait de (`'+tokensNumber+'`) '+process.env.COIN_NAME+' !')
            .setColor("Red");
          await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
          await accountsSchema.findOneAndUpdate({ discordID: userID }, { $inc: { coins: -tokensNumber } });
          const embed = new EmbedBuilder()
            .setTitle('Retrait de Diamands')
            .setDescription('Le compte de <@'+userID+'> a été débité avec succès de `'+tokensNumber+'` '+process.env.COIN_NAME+'.')
            .setColor("Green");
          await interaction.reply({ embeds: [embed], ephemeral: true });
          await logAction('Admin: <@'+interaction.user.id+'>\n User: <@'+userID+'>\n Diamands: ``'+tokensNumber+'``\n Type: ``Remove Coins``')
        }
      } else {
        await accountsSchema.findOneAndUpdate({ discordID: userID }, { $inc: { coins: +tokensNumber } });
        const embed = new EmbedBuilder()
          .setTitle('Ajout de Diamands')
          .setDescription('Le compte de <@'+userID+'> a été crédité avec succès de `'+tokensNumber+'` '+process.env.COIN_NAME+'.')
          .setColor("Green");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        await logAction('Admin: <@'+interaction.user.id+'>\n User: <@'+userID+'>\n Diamands: ``'+tokensNumber+'``\n Type: ``Add Coins``')
      }
    }
  } else if (interaction.customId === 'tokenInputModal') {
    if (isAlreadyInAction[interaction.user.id] == null) {
      const tokens = interaction.fields.getTextInputValue('tokenAmount');
      const tokensNumber = Number(tokens);
      const embed = new EmbedBuilder()
        .setDescription("Le nombre de token que vous avez entrée n'est pas valide. Veuillez réessayer le processus d'injection et entrer un chiffre positif valide.")
        .setColor("Red");
      if (isNaN(tokensNumber) || !Number.isInteger(tokensNumber) || Math.sign(tokensNumber) !== 1) {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        isAlreadyInAction[interaction.user.id] = true;
        const userAccount = await accountsSchema.findOne({ discordID: interaction.user.id });
        if (userAccount.active === false) {
          const embed = new EmbedBuilder()
            .setTitle('Injection de Diamands')
            .setDescription('Votre compte de jeu est actuellement désactivé. Vous ne pouvez pas injecter de '+process.env.COIN_NAME+' tant que votre compte est désactivé.')
            .setColor("Red");
          await interaction.reply({ embeds: [embed], ephemeral: true});
          isAlreadyInAction[interaction.user.id] = null;
          return;
        }
        if (parseInt(tokensNumber) > parseInt(userAccount.coins)) {
          const embed = new EmbedBuilder()
            .setTitle('Injection de Diamands')
            .setDescription('Vous n\'avez pas assez de '+process.env.COIN_NAME+' (`'+userAccount.coins+'`) pour satisfaire votre demande de transfert de (`'+tokensNumber+'`) '+process.env.COIN_NAME+' !')
            .setColor("Red");
          await interaction.reply({ embeds: [embed], ephemeral: true});
          isAlreadyInAction[interaction.user.id] = null;
        } else {
          await accountsSchema.findOneAndUpdate({ discordID: interaction.user.id }, { $inc: { coins: -tokensNumber } });
          const transaction = JSON.stringify({ action: "add", amount: tokensNumber });
          const discordID = interaction.user.id.toString();
          QueryDb(`INSERT INTO awaiting_transac (discord_id, transaction) VALUES ('${discordID}', '${transaction}')`, async function(result) {
            if (result.affectedRows > 0) {
              const embed = new EmbedBuilder()
                .setTitle('Injection de '+process.env.COIN_NAME+'')
                .setDescription('Votre compte de jeu a été crédité avec succès de `'+tokensNumber+'` '+process.env.COIN_NAME+'. Veuillez prévoir un délai de traitement de 5 à 10 minutes par notre système.')
                .setColor("Green");
              await interaction.reply({ embeds: [embed], ephemeral: true});
              await logAction('User: <@'+discordID+'>\n User ID: ``'+userID+'``\n Diamands: ``'+tokensNumber+'``\n Type: ``Inject Coins``')
              isAlreadyInAction[interaction.user.id] = null;
            } else {
              await accountsSchema.findOneAndUpdate({ discordID: interaction.user.id }, { $inc: { coins: +tokensNumber } });
              const embed = new EmbedBuilder()
                .setTitle('Injection de '+process.env.COIN_NAME+'')
                .setDescription('Une erreur s\'est produite lors de l\'injection. Nous vous avons rendu vos`'+tokensNumber+'` '+process.env.COIN_NAME+' sur le bot. Veuillez réessayer ultérieurement. Nous vous remercions de votre compréhension.')
                .setColor("Red");
              await interaction.reply({ embeds: [embed], ephemeral: true});
              isAlreadyInAction[interaction.user.id] = null;
            }
          });
        }
      }
    } else {
      const embed = new EmbedBuilder()
        .setDescription("Vous avez déjà une action avec des Diamands en cours. Veuillez attendre que votre action actuelle soit terminée avant d'en refaire une.")
        .setColor("Red");
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
});

// ############################################################################################################ Button Collector ############################################################################################################

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isButton()) return;
	if (interaction.customId === 'mytokenshelp') {
    const tokens = await getCoins(interaction.user.id)
    await interaction.reply({ content: 'Vous posséder actuellement `'+tokens+'` '+process.env.COIN_NAME+' !', ephemeral: true });
  } else if (interaction.customId === 'buytokenshelp') {
    const menu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tokenbuymenu')
        .setMinValues(1)
        .setMaxValues(1)
        .setPlaceholder('Faites votre choix de Donation...')
        .addOptions(
          {
            label: "Acheter des Diamants",
            description: "Les Diamants sont la monnaie virtuelle de Modern.",
            value: "1",
            emoji: "1209541241524584528"
            },
            {
            label: "Acheter un VIP",
            description: "Voir la boutique F1 IG pour plus d'informations sur les VIP.",
            value: "2",
            emoji: "1083824500535214101"
            },
        ),
    );
    await interaction.reply({ content: "En **choisissant de continuer** vous **accepter** nôtre [politique de donation.]("+process.env.TOS_URL+") \nChoisissez entre l'achat de "+process.env.COIN_NAME+" ou un VIP:", components: [menu], ephemeral: true });
  } else if (interaction.customId.startsWith('accept')) {
    const userID = interaction.customId.substring(6);
    const orderData = JSON.parse(manualOrderData[userID]);
    manualOrderData[userID] = null;
    isAlreadyInOrder[userID] = null;
    await interaction.update({components: []});
    await GenerateCoins(orderData.coins, orderData.id);
    await sendMessageToUser2(userID, orderData.coins, orderData.orderID);
    await pnlSchema.findOneAndUpdate({guid: process.env.GUILDID}, { $inc: { total: parseInt(orderData.coins) } });
    const guild = await client.guilds.fetch(process.env.GUILDID);
    const role = guild.roles.cache.get("1058490272150978642");
    const user = await guild.members.fetch(orderData.id);
    if (!user.roles.cache.has(role.id)) {
      await user.roles.add(role);
      console.log(`Added role '${role.name}' to ${user.tag}.`);
    }
  } else if (interaction.customId.startsWith('reject')) {
    const userID = interaction.customId.substring(6);
    const orderData = JSON.parse(manualOrderData[userID]);
    manualOrderData[userID] = null;
    isAlreadyInOrder[userID] = null;
    await interaction.update({components: []});
    sendMessageToUser3(userID, orderData.orderID);
  } else if (interaction.customId.startsWith('myaccounthelp')) {
    const tokens = await getCoins(interaction.user.id);
    const userData = await accountsSchema.findOne({ discordID: interaction.user.id });
    const vipData = JSON.parse(userData.vip);
    const vipStatus = userData.vip === "null" ? '``Pas de VIP.``' : '``'+vipData.type+' - ``<t:'+Math.floor(new Date(vipData.expiration).getTime() / 1000)+':R>';
    const creatorStatus = (userData.creator && userData.creator !== 'null') ? userData.creator : 'Pas de code créateur lié.';
    const emailStatus = (userData.email && userData.email !== 'null') ? userData.email : 'Pas de mail lié.';
    const embed = new EmbedBuilder()
    .setColor(0x8200e9)
    .setTitle(`Compte de donation **[${interaction.user.username}]**`)
    .setDescription('**Numero de compte :** `'+interaction.user.id+'`\n**Email :** ||`'+emailStatus+'`||\n**VIP :** '+vipStatus+'\n**Createur : **`'+creatorStatus+'`\n**Vos Diamands '+process.env.COIN_NAME+' :** `'+tokens+'`')
    .setFooter({ text: process.env.FOOTER_TEXT, iconURL: process.env.FOOTER_URL})
    .setTimestamp();
    if (userData.email === "null") {
      const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setURL(process.env.OAUTH2_URL)
          .setLabel('Lier l\'email')
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setCustomId('buytokenshelp')
          .setLabel('Donation')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('1209541241524584528')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('setcreator')
          .setLabel('Createur')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('1005550287764856922')
          .setDisabled(true),
      );
      await interaction.reply({ components:[row1], embeds:[embed], ephemeral: true });
    } else if (userData.active === false) {
      const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('sendtokens')
          .setLabel('Transférer IG')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('1211052334256488469')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('buytokenshelp')
          .setLabel('Donation')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('1209541241524584528')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('setcreator')
          .setLabel('Createur')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('1005550287764856922')
          .setDisabled(true),
      );
      const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('startbj')
          .setLabel('Blackjack')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🃏')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('startrt')
          .setLabel('Roulette')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🖲️')
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId('startcp')
          .setLabel('Craps')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎲')
          .setDisabled(true),
      );
      await interaction.reply({ content:'**VOTRE COMPTE EST BLOQUER POUR FRAUDE/ABUS, MERCI DE FAIRE UN TICKET POUR LE REACTIVER !**',components:[row1,row2], embeds:[embed], ephemeral: true });
    } else {
      const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('sendtokens')
          .setLabel('Transférer IG')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('1211052334256488469'),
        new ButtonBuilder()
          .setCustomId('buytokenshelp')
          .setLabel('Donation')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('1209541241524584528'),
          new ButtonBuilder()
          .setCustomId('setcreator')
          .setLabel('Createur')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('1005550287764856922'),
      );
      const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('startbj')
          .setLabel('Blackjack')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🃏')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('startrt')
          .setLabel('Roulette')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🖲️')
          .setDisabled(true),
          new ButtonBuilder()
          .setCustomId('startcp')
          .setLabel('Craps')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎲')
          .setDisabled(true),
      );
      await interaction.reply({ components:[row1,row2], embeds:[embed], ephemeral: true });
    }
  } else if (interaction.customId.startsWith('cgmail')) {
    const userId = interaction.customId.substring(6);
    const modal = new ModalBuilder()
    .setTitle("Entrer le nouveau mail.")
    .setCustomId("adminMailModal"+userId);
    const mail = new TextInputBuilder()
    .setCustomId("adminMailCode")
    .setRequired(true)
    .setPlaceholder('Attribuer un nouveau mail à un compte.')
    .setLabel("Saisir le nouveau mail")
    .setStyle(TextInputStyle.Short);
    const secoundActionRow2 = new ActionRowBuilder().addComponents(mail);
    modal.addComponents(secoundActionRow2);
    await interaction.showModal(modal);
  } else if (interaction.customId.startsWith('cgcreator')) {
    const userId = interaction.customId.substring(9);
    const modal = new ModalBuilder()
    .setTitle("Entrer le code créateur.")
    .setCustomId("adminCreatorInputModal"+userId);
    const code = new TextInputBuilder()
    .setCustomId("adminCreatorCode")
    .setRequired(true)
    .setPlaceholder('Attribuer un code créateur à un compte.')
    .setLabel("Saisir le code créateur")
    .setStyle(TextInputStyle.Short);
    const secoundActionRow2 = new ActionRowBuilder().addComponents(code);
    modal.addComponents(secoundActionRow2);
    await interaction.showModal(modal);
  } else if (interaction.customId.startsWith('cgvip')) {
    const userId = interaction.customId.substring(5);
    const adminvip = new ActionRowBuilder()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId('adminvip'+userId)
          .setMinValues(1)
          .setMaxValues(1)
					.setPlaceholder('Faites votre choix')
					.addOptions(
						{
							label: "Attribuer VIP",
							description: "Attribuer le VIP à un utilisateur.",
							value: "add",
              emoji: "1083824500535214101",
						},
            {
							label: "Voir VIP",
							description: "Voir le statut vip d'un utilisateur.",
							value: "see",
              emoji: "1083824500535214101",
						},
            {
							label: "Enlever VIP",
							description: "Enlever le VIP à un utilisateur.",
							value: "rem",
              emoji: "1083824500535214101",
						}
          ));
    await interaction.update({ content: 'Interactions sur VIP :', components: [adminvip], embeds:[], ephemeral: true });
  } else if (interaction.customId.startsWith('setcreator')) {
    const userData = await accountsSchema.findOne({ discordID: interaction.user.id });
    if (userData.creator == 'null') {
      const modal = new ModalBuilder()
      .setTitle("Entrer le code créateur.")
      .setCustomId("creatorInputModal");
      const code = new TextInputBuilder()
      .setCustomId("creatorCode")
      .setRequired(true)
      .setPlaceholder('Attribuer un code créateur à votre compte.')
      .setLabel("Saisir le code créateur")
      .setStyle(TextInputStyle.Short);
      const secoundActionRow2 = new ActionRowBuilder().addComponents(code);
      modal.addComponents(secoundActionRow2);
      await interaction.showModal(modal);
    } else {
      const embed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`Vous avez deja un code créateur lié à votre compte. Votre code créateur actuel est : \`${userData.creator}\` \n\n Si vous souhaitez le changer, veuillez ouvrir un ticket.`);
      await interaction.reply({embeds: [embed], ephemeral: true });
    }
  } else if (interaction.customId.startsWith('startbj')) {
    const miseModal = new ModalBuilder()
    .setTitle("Entrer la mise.")
    .setCustomId("miseInputModalBJ");
    const miseInput = new TextInputBuilder()
    .setCustomId("miseAmountBJ")
    .setRequired(true)
    .setLabel("Entrer la mise")
    .setPlaceholder("Mise pour la partie de Blackjack")
    .setStyle(TextInputStyle.Short);
    const secoundActionRow2 = new ActionRowBuilder().addComponents(miseInput);
    miseModal.addComponents(secoundActionRow2);
    await interaction.showModal(miseModal);
  } else if (interaction.customId.startsWith('startrt')) {
    const miseModal = new ModalBuilder()
    .setTitle("Entrer la mise.")
    .setCustomId("miseInputModalRT");
    const miseInput = new TextInputBuilder()
    .setCustomId("miseAmountRT")
    .setRequired(true)
    .setLabel("Entrer la mise")
    .setPlaceholder("Mise pour la partie de Roulette")
    .setStyle(TextInputStyle.Short);
    const secoundActionRow2 = new ActionRowBuilder().addComponents(miseInput);
    miseModal.addComponents(secoundActionRow2);
    await interaction.showModal(miseModal);
  } else if (interaction.customId.startsWith('startcp')) {
    const miseModal = new ModalBuilder()
    .setTitle("Entrer la mise.")
    .setCustomId("miseInputModalCP");
    const miseInput = new TextInputBuilder()
    .setCustomId("miseAmountCP")
    .setRequired(true)
    .setLabel("Entrer la mise")
    .setPlaceholder("Mise pour la partie de Craps")
    .setStyle(TextInputStyle.Short);
    const secoundActionRow2 = new ActionRowBuilder().addComponents(miseInput);
    miseModal.addComponents(secoundActionRow2);
    await interaction.showModal(miseModal);
  } else if (interaction.customId.startsWith('sendtokens')) {
    const tokenModal = new ModalBuilder()
    .setTitle("Entrer les informations pour l'envoi.")
    .setCustomId("tokenInputModal");
    const tokenInput = new TextInputBuilder()
    .setCustomId("tokenAmount")
    .setRequired(true)
    .setLabel("Entrer le nombre de Diamants à transférer ig.")
    .setPlaceholder("Quantité de Diamants à transférer sur le serveur.")
    .setStyle(TextInputStyle.Short);
    const secoundActionRow2 = new ActionRowBuilder().addComponents(tokenInput);
    tokenModal.addComponents(secoundActionRow2);
    await interaction.showModal(tokenModal);
  } else if (interaction.customId.startsWith('enable') || interaction.customId.startsWith('disabl')) {
    const userId = interaction.customId.substring(6);
    if (interaction.customId.startsWith('enable')) {
      await accountsSchema.findOneAndUpdate({ discordID: userId }, { $set: { active: true } });
      const embed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(`Le compte de donation de <@${userId}> a été activé.`);
      await interaction.update({ content: '', embeds:[embed], components:[], ephemeral:true });
      await logAction('Admin: <@'+interaction.user.id+'>\n User: <@'+userId+'>\nType: ``Enable Account``')
    } else {
      await accountsSchema.findOneAndUpdate({ discordID: userId }, { $set: { active: false } });
      const embed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`Le compte de donation de <@${userId}> a été désactiver.`);
      await interaction.update({ content: '', embeds:[embed], components:[], ephemeral:true });
      await logAction('User: <@'+interaction.user.id+'>\n User ID: <@'+userId+'>\nType: ``Disable Account``')
    }
  } else if (interaction.customId.startsWith('removeco') || interaction.customId.startsWith('addcoins')) {
    const userId = interaction.customId.substring(8);
    if (interaction.customId.startsWith('removeco')) {
      const modal = new ModalBuilder()
      .setTitle("Entrer le montant à retirer.")
      .setCustomId("removeCoinsModal"+userId);
      const amountInput = new TextInputBuilder()
      .setCustomId("removeCoinsAmount")
      .setRequired(true)
      .setLabel("Entrer le montant")
      .setPlaceholder("Montant à retirer")
      .setStyle(TextInputStyle.Short);
      const secoundActionRow2 = new ActionRowBuilder().addComponents(amountInput);
      modal.addComponents(secoundActionRow2);
      await interaction.showModal(modal);
      await interaction.deleteReply();
    } else {
      const modal = new ModalBuilder()
      .setTitle("Entrer le montant à ajouter.")
      .setCustomId("addCoinsModal"+userId);
      const amountInput = new TextInputBuilder()
      .setCustomId("addCoinsAmount")
      .setRequired(true)
      .setLabel("Entrer le montant")
      .setPlaceholder("Montant à ajouter")
      .setStyle(TextInputStyle.Short);
      const secoundActionRow2 = new ActionRowBuilder().addComponents(amountInput);
      modal.addComponents(secoundActionRow2);
      await interaction.showModal(modal);
      await interaction.deleteReply();
    }
  }
});

// ############################################################################################################ String Select Collector ############################################################################################################

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;
    if (interaction.customId === 'gatewaymenu') {
      let Gateway
      if (interaction.isModalSubmit()) {
        Gateway = 'sellix'
        const amount = interaction.fields.getTextInputValue('amount');
        const parsedAmount = parseInt(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          const embed3 = new EmbedBuilder()
          .setColor(`Red`)
          .setDescription(`Merci de refaire la procedure en  mettant un montant valide, supérieur à 0 et entier.`);
          await interaction.update({ content: "", embeds: [embed3], components: [] });
          return;
        } else {
          jsonData[interaction.user.id] = JSON.stringify({coins: parsedAmount, items: {id: 10, quantity: 1}, donation: true});
        }
      } else {
        Gateway = interaction.values[0];
      }
      let responsefromapi;
      switch (Gateway) {
        case 'tebex':
          const embed = new EmbedBuilder()
          .setColor(0x8200e9)
          .setDescription(`Pour procéder au payment, [cliquez sur ce lien vers notre site Tebex](https://store.modern5m.com). \n \n Si vous avez vos messages privés ouverts sur le serveur de Modern, vous receverez une confirmation une fois le paiement effectué.`);
          await interaction.update({ content: "", embeds: [embed], components: [] });
        break;
        case 'sellix':
          const orderData = JSON.parse(jsonData[interaction.user.id]);
          if (orderData.coins !== 0) {
            const accountData = await accountsSchema.findOne({ discordID: interaction.user.id });
            if (accountData.active === false) {
              const embed = new EmbedBuilder()
                .setDescription('Votre compte de jeu est actuellement désactivé. Vous ne pouvez pas faire de donation tant que votre compte est désactivé. Veuillez ouvrir un ticket pour plus d\'informations.')
                .setColor("Red");
              await interaction.reply({ embeds: [embed], ephemeral: true});
              return;
            }
            responsefromapi = await RequestPaymentUrl("sellix", jsonData[interaction.user.id], interaction.user.id, accountData.email, accountData.coupon, accountData.creator);
            const embed2 = new EmbedBuilder()
              .setColor(0x8200e9)
              .setDescription(`Pour procéder au payment, [cliquez sur ce lien](${responsefromapi.url}). \n \n Si vous avez vos messages privés ouverts sur le serveur de Modern, vous receverez une confirmation une fois le paiement effectué.`);
            await interaction.update({ content: "", embeds: [embed2], components: [] });
            break;
          } else {
            const accountData = await accountsSchema.findOne({ discordID: interaction.user.id });
            if (accountData.active === false) {
              const embed = new EmbedBuilder()
                .setDescription('Votre compte de jeu est actuellement désactivé. Vous ne pouvez pas faire de donation tant que votre compte est désactivé. Veuillez ouvrir un ticket pour plus d\'informations.')
                .setColor("Red");
              await interaction.reply({ embeds: [embed], ephemeral: true});
              return;
            }
            const modal = new ModalBuilder()
            .setTitle("Entrer le montant de la donation.")
            .setCustomId("gatewaymenu");
            const amount = new TextInputBuilder()
            .setCustomId("amount")
            .setRequired(true)
            .setPlaceholder('Montant en EURO sans virgule, chiffres entiers.')
            .setLabel("Montant de la donation en €.")
            .setStyle(TextInputStyle.Short);
            const firstActionRow = new ActionRowBuilder().addComponents(amount);
            modal.addComponents(firstActionRow);
            await interaction.showModal(modal);
            break;
          }
        case 'manuel':
          const accountData1 = await accountsSchema.findOne({ discordID: interaction.user.id });
          if (accountData1.active === false) {
            const embed = new EmbedBuilder()
              .setDescription('Votre compte de jeu est actuellement désactivé. Vous ne pouvez pas faire de donation tant que votre compte est désactivé. Veuillez ouvrir un ticket pour plus d\'informations.')
              .setColor("Red");
            await interaction.reply({ embeds: [embed], ephemeral: true});
            return;
          }
          if (isAlreadyInOrder[interaction.user.id]) {
            const embed3 = new EmbedBuilder()
            .setColor(`Red`)
            .setDescription(`Vous avez deja une commande manuelle en cours sur votre compte. Veuillez attendre que celle-ci soit traitée avant d'en faire une autre.`);
            await interaction.update({ content: "", embeds: [embed3], components: [] });
            return;
          }
          const orderinfo = JSON.parse(jsonData[interaction.user.id]);
          const orderID = generateOrderID();
          manualOrderData[interaction.user.id] = JSON.stringify({
            coins: orderinfo.coins,
            items: orderinfo.items,
            id: interaction.user.id,
            orderID: orderID
          })
          const modal = new ModalBuilder()
          .setTitle("Entrer les informations.")
          .setCustomId("manualinput");
          const code = new TextInputBuilder()
          .setCustomId("codepcs")
          .setRequired(true)
          .setPlaceholder('À séparer avec une virgule (,) si plusieurs.')
          .setLabel("Code coupon PCS/Paysafecard")
          .setStyle(TextInputStyle.Short);
          const amountcode = new TextInputBuilder()
          .setCustomId("amountcode")
          .setRequired(true)
          .setPlaceholder('La somme totale de(s) coupon(s) en EURO.')
          .setLabel("Montant du coupon PCS/Paysafecard en €")
          .setStyle(TextInputStyle.Short);
          const firstActionRow = new ActionRowBuilder().addComponents(code);
          const secoundActionRow = new ActionRowBuilder().addComponents(amountcode);
          modal.addComponents(firstActionRow, secoundActionRow);
          await interaction.showModal(modal);
          await interaction.deleteReply();
        break;
      }
    }
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === 'tokenbuymenufinal' || interaction.customId === 'tokenbuymenufinalvip') {
        let totalamount = 0;
        let coinamount = 0;
        if (interaction.values[0] == '10') {
          jsonData[interaction.user.id] = JSON.stringify({items: {id: 10,quantity: 1}, coins:0, donation:true}); 
        } else {
          const items = interaction.values.map(value => {
            const storeItem = storeItems.get(parseInt(value));
            if (storeItem) {
                totalamount += storeItem.price;
                return { id: parseInt(value), quantity: 1 }
            }
          })
          const items2 = interaction.values.map(value => {
            const storeItem = storeItems.get(parseInt(value));
            if (storeItem) {
                coinamount += storeItem.priceInCents;
                return { id: parseInt(value), quantity: 1 }
            }
          })
          jsonData[interaction.user.id] = JSON.stringify({items:items, coins:coinamount});
        }
        const orderData = JSON.parse(jsonData[interaction.user.id]);
        if (interaction.customId === 'tokenbuymenufinalvip' || orderData.donation === true) {
          const gatewaymenu = new ActionRowBuilder()
          .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('gatewaymenu')
            .setMinValues(1)
            .setMaxValues(1)
            .setPlaceholder('Faites votre choix')
            .addOptions(
              {
                label: "Plateforme de Donation",
                description: "Pour les paiments via Paypal, Carte Bancaire & Cryptomonnaie.",
                value: "tebex",
              }));
          await interaction.update({ content: `Vous vous apprêtez à prendre un abonnement VIP de ${totalamount}€.\nChoisissez votre moyen de paiement :`, components: [gatewaymenu] });
        } else {
          const gatewaymenu = new ActionRowBuilder()
          .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('gatewaymenu')
            .setMinValues(1)
            .setMaxValues(1)
            .setPlaceholder('Faites votre choix')
            .addOptions(
              {
                label: "Plateforme de Donation",
                description: "Pour les paiments via Paypal & Carte Bancaire.",
                value: "tebex",
              },
              {
                label: "Manuel",
                description: "Pour les paiments via Pcs & Paysafecard.",
                value: "manuel",
              }));
          await interaction.update({ content: `Vous vous apprêtez à faire une donation de ${totalamount}€.\nChoisissez votre moyen de paiement :`, components: [gatewaymenu] });
        }
    } else if (interaction.customId === 'tokenbuymenu') {
      const items = interaction.values
      if (items.includes('1')) {
        const menu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('tokenbuymenufinal')
            .setMinValues(1)
            .setMaxValues(1)
            .setPlaceholder('Faites votre choix de Diamants...')
            .addOptions(
              {
                label: "1000 Diamants",
                description: "10€",
                value: "1",
                emoji: "1209541241524584528"
                },
                {
                label: "2500 Diamants",
                description: "25€",
                value: "2",
                emoji: "1209541241524584528"
                },
                {
                label: "5000 Diamants",
                description: "50€",
                value: "3",
                emoji: "1209541241524584528"
                },
                {
                label: "10000 Diamants + 2000 Offerts",
                description: "100€",
                value: "4",
                emoji: "1209541241524584528"
                },
                {
                label: "20000 Diamants + 5000 Offerts",
                description: "200€",
                value: "5",
                emoji: "1209541241524584528"
                },
                {
                  label: "Donation",
                  description: "A choisir dans la prochaine étape.",
                  value: "10",
                  emoji: "1209541241524584528"
                }

            ),
        );
        await interaction.update({ content: "En **choisissant de continuer** vous **accepter** nôtre [politique de donation.](https://cdn.blaze5m.com/blaze_tos2.pdf) \nChoisissez la quantité de "+process.env.COIN_NAME+" :", components: [menu], ephemeral: true });
      } else {
        const menu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('tokenbuymenufinalvip')
            .setMinValues(1)
            .setMaxValues(1)
            .setPlaceholder('Faites votre choix de VIP...')
            .addOptions(
              {
                label: "VIP Bronze - 25€/mois (SANS ENGAGEMENT)",
                description: "Voir boutique F1 IG pour plus d'informations sur les VIP.",
                value: "6",
                emoji: "1219431722559733791"
                },
                {
                label: "VIP Argent - 50€/mois (SANS ENGAGEMENT)",
                description: "Voir boutique F1 IG pour plus d'informations sur les VIP.",
                value: "7",
                emoji: "1219431724467884112"
                },
                {
                label: "VIP Or - 100€/mois (SANS ENGAGEMENT)",
                description: "Voir boutique F1 IG pour plus d'informations sur les VIP.",
                value: "8",
                emoji: "1219431729236803584"
                },
                {
                label: "VIP Platinium - 120€/mois (SANS ENGAGEMENT)",
                description: "Voir boutique F1 IG pour plus d'informations sur les VIP.",
                value: "9",
                emoji: "1219431726053331044"
              },
            ),
        );
        await interaction.update({ content: "En **choisissant de continuer** vous **accepter** nôtre [politique de donation.](https://cdn.blaze5m.com/blaze_tos2.pdf) \nChoisissez votre abonnement VIP :", components: [menu], ephemeral: true });
      }
    } else if (interaction.customId.startsWith('viptype')) {
      const userId = interaction.customId.substring(7);
      const vipType = interaction.values[0];
      const guild = await client.guilds.fetch(process.env.GUILDID);
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      await accountsSchema.findOneAndUpdate({ discordID: userId }, { $set: { vip: JSON.stringify({ type: vipType, expiration: expirationDate.toISOString().slice(0, 10) }) } });
      const vipLevels = { "VIP Bronze": 1, "VIP Argent": 2, "VIP Or": 3, "VIP Platinium": 4 };
      const vip_level = vipLevels[vipType] || null;
      const roleIds = { 1: "1219456770733244526", 2: "1219321282391314472", 3: "1058490268338360320", 4: "1211687706753769512" };
      const roleId = roleIds[vip_level];
      QueryDb(`INSERT INTO users_vip (discordId, vip_level, expiration) VALUES ('${userId}', '${vip_level}', '${expirationDate.toISOString().slice(0, 10)}')`, async function(result) {
        if (result.affectedRows > 0) {
          const role = guild.roles.cache.get(roleId);
          const role1 = guild.roles.cache.get("1058490272150978642");
          const user = await guild.members.fetch(userId);
          if (!user.roles.cache.has(role.id)) {
            await user.roles.add(role);
            console.log(`Added role '${role.name}' to ${userId}.`);
          }
          if (!user.roles.cache.has(role1.id)) {
            await user.roles.add(role1);
            console.log(`Added role '${role1.name}' to ${userId}.`);
          }
          const embed = new EmbedBuilder()
          .setColor(0x8200e9)
          .setDescription(`Le VIP de <@${userId}> a été ajouté avec succès.`);
          await interaction.update({ content: '', components: [], embeds:[embed], ephemeral:true });
          await logAction('Admin: <@'+interaction.user.id+'>\n User: <@'+userId+'>\nVIP Type: ``'+vipType+'``\nExpiration: ``'+expirationDate.toISOString().slice(0, 10)+'``\nType: ``Add VIP``')
          sendMessageToUser4(userId, "MANUEL", vipType, expirationDate.toISOString().slice(0, 10));
        } else {
          const embed = new EmbedBuilder()
          .setColor("Red")
          .setDescription(`Une erreur est survenue lors de l'ajout du VIP à <@${userId}>. Veuillez ouvrir un ticket pour plus d'informations. Erreur [DB INJECTION]`);
          await interaction.update({ content: '', embeds:[embed], components:[], ephemeral:true });
          await logAction('Admin: <@'+interaction.user.id+'>\n User: <@'+userId+'>\nVIP Type: ``'+vipType+'``\nExpiration: ``'+expirationDate.toISOString().slice(0, 10)+'``\nType: ``Add VIP``')
      }});
    } else if (interaction.customId.startsWith('adminvip')) {
      const userId = interaction.customId.substring(8);
      switch (interaction.values[0]) {
        case 'add':
          const menu2 = new ActionRowBuilder()
          .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("viptype"+userId)
            .setMinValues(1)
            .setMaxValues(1)
            .setPlaceholder('Faites votre choix')
            .addOptions(
              {
                label: "VIP Bronze",
                description: "VIP Bronze - 25€/mois (SANS ENGAGEMENT)",
                value: "VIP Bronze",
                emoji: "1219431722559733791"
              },
              {
                label: "VIP Argent",
                description: "VIP Argent - 50€/mois (SANS ENGAGEMENT)",
                value: "VIP Argent",
                emoji: "1219431724467884112"
              },
              {
                label: "VIP Or",
                description: "VIP Or - 100€/mois (SANS ENGAGEMENT)",
                value: "VIP Or",
                emoji: "1219431729236803584"
              },
              {
                label: "VIP Platinium",
                description: "VIP Platinium - 120€/mois (SANS ENGAGEMENT)",
                value: "VIP Platinium",
                emoji: "1219431726053331044"
              }
            )
          );
          await interaction.update({ content: 'Choisissez le type de VIP à attribuer :', components: [menu2], ephemeral: true });
          break;
        case 'see':
          const userData = await accountsSchema.findOne({ discordID: userId });
          const vipData = JSON.parse(userData.vip);
          const vipStatus = userData.vip === "null" ? '``Pas de VIP.``' : '``'+vipData.type+' - ``<t:'+Math.floor(new Date(vipData.expiration).getTime() / 1000)+':R>';
          const embed = new EmbedBuilder()
          .setColor(0x8200e9)
          .setDescription(`Le statut VIP de <@${userId}> est actuellement : ${vipStatus}`);
          await interaction.update({ content: '', components: [], embeds:[embed], ephemeral:true }); 
        case 'rem':
          const userDatarem = await accountsSchema.findOne({ discordID: userId });
          if (userDatarem.vip !== "null") {
            const vipData1 = JSON.parse(userDatarem.vip);
            const guild = await client.guilds.fetch(process.env.GUILDID);
            QueryDb(`DELETE FROM users_vip WHERE discordId = '${userId}'`, async function(result) {
              if (result.affectedRows > 0) {
                const vipLevels1 = { "VIP Bronze": 1, "VIP Argent": 2, "VIP Or": 3, "VIP Platinium": 4 };
                const vip_level1 = vipLevels1[vipData1.type] || null;
                const roleIds1 = { 1: "1219456770733244526", 2: "1219321282391314472", 3: "1058490268338360320", 4: "1211687706753769512" };
                const roleId1 = roleIds1[vip_level1];
                const role2 = guild.roles.cache.get(roleId1);
                const user = await guild.members.fetch(userDatarem.discordID);
                if (user.roles.cache.has(role2.id)) {
                  await user.roles.remove(role2);
                  console.log(`Removed role '${role2.name}' from ${userId}.`);
                }
                userDatarem.vip = "null";
                await userDatarem.save();
                const embed1 = new EmbedBuilder()
                .setColor(0x8200e9)
                .setDescription(`Le VIP de <@${userId}> a été supprimé avec succès.`);
                await interaction.update({ content: '', components: [], embeds:[embed1], ephemeral:true });
                await logAction('Admin: <@'+interaction.user.id+'>\n User: <@'+userId+'>\nType: ``Remove VIP``')
              } else {
                const vipLevels1 = { "VIP Bronze": 1, "VIP Argent": 2, "VIP Or": 3, "VIP Platinium": 4 };
                const vip_level1 = vipLevels1[vipData1.type] || null;
                const roleIds1 = { 1: "1219456770733244526", 2: "1219321282391314472", 3: "1058490268338360320", 4: "1211687706753769512" };
                const roleId1 = roleIds1[vip_level1];
                const role2 = guild.roles.cache.get(roleId1);
                const user = await guild.members.fetch(userDatarem.discordID);
                if (user.roles.cache.has(role2.id)) {
                  await user.roles.remove(role2);
                  console.log(`Removed role '${role2.name}' from ${userId}.`);
                }
                userDatarem.vip = "null";
                await userDatarem.save();
                const embed1 = new EmbedBuilder()
                .setColor(0x8200e9)
                .setDescription(`Une erreur est survenue lors de la suppression du VIP de <@${userId}>. Veuillez ouvrir un ticket pour plus d'informations.`);
                await interaction.update({ content: '', components: [], embeds:[embed1], ephemeral:true });
                await logAction('Admin: <@'+interaction.user.id+'>\n User: <@'+userId+'>\nType: ``Remove VIP``')
              }
            });
          } else {
            const embed = new EmbedBuilder()
            .setColor(0x8200e9)
            .setDescription(`L'utilisateur <@${userId}> n'a pas de VIP.`);
            await interaction.update({ content: '', components: [], embeds:[embed], ephemeral:true });
          }
          break;
      }
    }
})

// ############################################################################################################ DiscordJS Functions ############################################################################################################

async function getCoins(userId) {
  let doc = await accountsSchema.findOne({ discordID: userId });
  if (!doc) {
    doc = new accountsSchema({ discordID: userId, coins: 0, vip: "null" , email: "null", creator: "null", token: "null", refresh: "null", total: 0, active: true});
    await doc.save();
  }
  return doc.coins;
}

async function GenerateCoins(totalCoins, DiscordID) {
  try {
    // Update the account document to increase coins and total fields
    const filter = { discordID: DiscordID };
    const update = { 
      $inc: { 
        coins: parseInt(totalCoins),
        total: parseInt(totalCoins)
      } 
    };
    await accountsSchema.updateOne(filter, update);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function sendMessageToUser(userId, orderID) {
  const message = 'Votre commande (ID de commande : `'+orderID+'`) a été contestée par votre banque. En raison du non-respect de nos politiques de donations [ici](https://cdn.blaze5m.com/blaze_tos2.pdf), votre compte donateur a été suspendu et vous avez été automatiquement banni du serveur en jeu. Pour plus d\'informations, veuillez ouvrir un ticket dans <#1058490451520393366>. Nous vous remercions de votre compréhension.';
  await client.users.send(userId, message);
}

async function sendMessageToUser2(userId, coins, orderID) {
  const message = 'Votre commande (ID de commande : `'+orderID+'` ) a été traitée et vous avez reçu `'+coins+'` '+process.env.COIN_NAME+'. \nVous pouvez maintenant voir vos '+process.env.COIN_NAME+' en appuyant sur le bouton Modern\'Store dans le canal <#1089653501396779128> !\nMerci pour votre soutien, l\'équipe Modern :love_you_gesture:';
  await client.users.send(userId, message);
}

async function sendMessageToUser3(userId, orderID) {
  const user = client.users.cache.get(userId);
  const message = 'Votre commande (ID de commande : `'+orderID+'` ) a été refuser pour raison: `Code Invalide/Deja Utiliser` ';
  await user.send(message);
}

async function sendMessageToUser4(userId, orderId, vip, expiration) {
  const message = 'Votre commande (ID de commande : `'+orderId+'`) a été traitée et vous avez reçu le statut VIP : `'+vip+'`. Votre statut VIP expirera le  `'+expiration+'`. \nVous pouvez maintenant profiter de vos avantages VIP sur notre serveur. \nMerci pour votre soutien, l\'équipe Modern :love_you_gesture:';
  await client.users.send(userId, message);
}

function generateOrderID() {
  const prefix = "Modern-";
  const suffix = "-b9d6";
  const randomPart = Math.random().toString(36).substr(2, 10);
  const timestamp = new Date().getTime().toString().substr(-4);
  return prefix + randomPart + timestamp + suffix;
}

async function RequestPaymentUrl(api, cartinfo, discordID, email, coupon, creator) {
  let response;
  const parsedData = JSON.parse(cartinfo);
  const orderID = generateOrderID();
  if (api === 'sellix') {
    const validCoupons = ["BAHAHAHDjjdfejfdfef"];
    // Check if the coupon is valid
    if (!validCoupons.includes(coupon)) {
      coupon = null;
    }
    if (parsedData.donation === true) {
      const paymentPayload = {
        title: "Modern Roleplay - Donation",
        value: parsedData.coins,
        currency: "EUR",
        quantity: 1,
        email: email,
        coupon_code: coupon || null,
        affiliate_revenue_customer_id: creator || null,
        white_label: false,
        return_url: "https://modern5m.com"
      };
      response = await sellix.payments.create(paymentPayload);
      if (response.url) {
        const pendingOrder = new orderSchema({
          discordID: discordID,
          orderID: orderID,
          sellixID: response.uniqid,
          amount: 0,
          email: email,
          paid: false
        });
        await pendingOrder.save();
        return response;
      }
    } else {
      const sellix_id = parsedData.items.map(item => {
        const storeItem = storeItems.get(item.id);
        return storeItem.sellix;
      });
      const iscoin = parsedData.items.map(item => {
        const storeItem = storeItems.get(item.id);
        return storeItem.iscoin;
      });
      const paymentPayload = {
        product_id: sellix_id[0],
        quantity: 1,
        email: email,
        coupon_code: coupon || null,
        affiliate_revenue_customer_id: creator || null,
        white_label: false,
        return_url: "https://modern5m.com"
      };
      response = await sellix.payments.create(paymentPayload);
      if (response.url) {
        let pendingOrder;
        if (iscoin[0] === false) {
          pendingOrder = new orderSchema({
            discordID: discordID,
            orderID: sellix_id[0],
            sellixID: response.uniqid,
            amount: 0,
            email: email,
            paid: false
          }); 
        } else {
          pendingOrder = new orderSchema({
            discordID: discordID,
            orderID: orderID,
            sellixID: response.uniqid,
            amount: parsedData.coins,
            email: email,
            paid: false
          });
        }
        await pendingOrder.save();
        return response;
      }
    }
  } else {
    throw new Error(`Unsupported API: ${api}`);
  }
}
// ############################################################################################################ Express Webhook Sellix/Discord API ############################################################################################################ 

app.post("/c1dflLo99SlYDjb1zpL570T8WwCeBL", express.raw({type: "application/json"}), async (request, response) => {
  const newpayload = JSON.parse(request.body);
  const guild = await client.guilds.fetch(process.env.GUILDID);
  switch (newpayload.event) {
  case "order:disputed":
    let PaymentID1 = newpayload.data.uniqid;
    const orderdis = await orderSchema.findOne({sellixID: PaymentID1});
    if (orderdis !== null && orderdis.paid === true) {
      await accountsSchema.findOneAndUpdate({ discordID: orderdis.discordID }, { $set: { active: false } });
      orderdis.paid = false;
      await orderdis.save();
      await logAction('User: <@'+orderdis.discordID+'>\n User ID: ``'+orderdis.discordID+'``\n Payment ID: ``'+PaymentID1+'``\n Type: ``Order Disputed``')
      sendMessageToUser(orderdis.discordID, PaymentID1);
    }
    response.json({received: true});
    break;
  case "product:dynamic":
    if (newpayload.data.type === "PRODUCT_SUBSCRIPTION") {
      let PaymentID;
      const check = await orderSchema.findOne({sellixID: newpayload.data.uniqid});
      if (check !== null) {
        PaymentID = newpayload.data.uniqid;
      } else {
        PaymentID = newpayload.data.recurring_billing_id;
      }
      const order = await orderSchema.findOne({sellixID: PaymentID});
      if (order !== null) {
        const storeItem = Array.from(storeItems.values()).find(item => item.sellix === order.orderID);
        const vipType = storeItem ? storeItem.name : null;
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        if (order.paid === false) {
          order.paid = true;
          order.PaymentID = newpayload.data.recurring_billing_id;
          await order.save();
        }
        const vipLevels = { "VIP Bronze": 1, "VIP Argent": 2, "VIP Or": 3, "VIP Platinium": 4 };
        const vip_level = vipLevels[vipType] || null;
        const roleIds = { 1: "1219456770733244526", 2: "1219321282391314472", 3: "1058490268338360320", 4: "1211687706753769512" };
        const roleId = roleIds[vip_level];
        QueryDb(`INSERT INTO users_vip (discordId, vip_level, expiration) VALUES ('${order.discordID}', '${vip_level}', '${expirationDate.toISOString().slice(0, 10)}') ON DUPLICATE KEY UPDATE vip_level = VALUES(vip_level), expiration = VALUES(expiration)`, async function(result) {
          if (result.affectedRows > 0) {
            await accountsSchema.findOneAndUpdate({ discordID: order.discordID }, { $set: { vip: JSON.stringify({ type: vipType, expiration: expirationDate.toISOString().slice(0, 10) }) } });
            const role = guild.roles.cache.get(roleId);
            const role1 = guild.roles.cache.get("1058490272150978642");
            const user = await guild.members.fetch(order.discordID);
            if (!user.roles.cache.has(role.id)) {
              await user.roles.add(role);
              console.log(`Added role '${role.name}' to ${order.discordID}.`);
            }
            if (!user.roles.cache.has(role1.id)) {
              await user.roles.add(role1);
              console.log(`Added role '${role1.name}' to ${order.discordID}.`);
            }
            await logAction('User: <@'+order.discordID+'>\n User ID: ``'+order.discordID+'``\n Payment ID: ``'+PaymentID+'``\n VIP Type: ``'+vipType+'``\n Expiration: ``'+expirationDate.toISOString().slice(0, 10)+'``\n Type: ``'+newpayload.data.type+'``')
            response.json({received: true, account: order.discordID, orderId: PaymentID, comment: "VIP subscription added to user account until ."});
          } else {
            response.json({received: true, error: "Error getting order from DB, please open a support ticket at discord.gg/modern."});
          }
        });
        const discordId = order.discordID.toString();
        const orderId = PaymentID.toString();
        const sendDate = expirationDate.toISOString().slice(0, 10)
        sendMessageToUser4(discordId, orderId, vipType, sendDate);
        break;
      } else {
        response.json({received: true, error: "Error getting order from DB, please open a support ticket at discord.gg/modern."});
        break;
      }
    } else if (newpayload.data.type === "PUBLIC_REST_API") {
      const PaymentID = newpayload.data.uniqid;
      const order = await orderSchema.findOne({sellixID: PaymentID});
      if (order !== null && order.paid === false) {
        await orderSchema.findOneAndUpdate({sellixID: PaymentID}, {paid: true});
        const role = guild.roles.cache.get("1058490272150978642");
        const user = await guild.members.fetch(order.discordID);
        if (!user.roles.cache.has(role.id)) {
          await user.roles.add(role);
          console.log(`Added role '${role.name}' to ${order.discordID}.`);
        }
        await GenerateCoins(order.amount, order.discordID);
        sendMessageToUser2(order.discordID, order.amount, PaymentID);
        await logAction('User: <@'+order.discordID+'>\n User ID: ``'+order.discordID+'``\n Payment ID: ``'+PaymentID+'``\n Amount €: ``'+order.amount/100+'``\n Diamands: ``'+order.amount+'``\n Type: ``'+newpayload.data.type+'``',)
        response.json({received: true, account: order.discordID, amount: order.amount , orderId: PaymentID, comment: "Diamands & discord role added to user account."});
        break;
      } else {
        response.json({received: true, error: "Error getting order from DB, please open a support ticket at discord.gg/modern."});
        break;
      }
    } else {
      response.json({received: true, error: "Error getting order from DB, please open a support ticket at discord.gg/modern."});
      break;
    }
  default:
    response.status(400).send(`Webhook Error: signatures do not match`);
    console.log(`Unhandled event type ${newpayload.event}`);
  }
});

app.get('/auth/discord/callback', async (req, res) => {
  const {code} = req.query;
  
  if (code) {
    try {
      const formData = new url.URLSearchParams({
        client_id: process.env.CLIENTID,
        client_secret: process.env.CLIENTSECRET,
        grant_type: 'authorization_code',
        code: code.toString(),
        redirect_uri: process.env.REDIRECTURI,
      });

      let output;
      try {
        output = await axios.post('https://discord.com/api/v10/oauth2/token',
          formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
      } catch (error) {
        return res.status(500).send('An error occured while adding your email (Invalid Code) ! Please try again.');
      }

      if (output.data.access_token) {
        const access = output.data.access_token;
        const userinfo = await axios.get('https://discord.com/api/v10/users/@me', { 
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        if (userinfo.data.id && userinfo.data.email) {
          await accountsSchema.findOneAndUpdate({ discordID: userinfo.data.id }, { $set: { email: userinfo.data.email, token: output.data.access_token, refresh: output.data.refresh_token } });
          console.log(`Email ${userinfo.data.email} added to ${userinfo.data.id}`);
          await logAction('User: <@'+userinfo.data.id+'>\n User ID: ``'+userinfo.data.id+'``\n Mail Lier: ``'+userinfo.data.email+'``',)
        }
        res.send('<br/>Email lier a votre compte avec succès ! Vous pouvez desormais fermer cette page.<br/><br/> Retourner dans le channel boutique sur discord et appuyer sur le bouton mon compte pour verifier que votre mail soit bien lier.');
      };
    } catch (error) {
      res.status(500).send('An error occured while adding your email ! Please try again.');
    }
  }
});

app.listen(4002, () => {
  console.log(`Modern Mothership API is UP !`);
})

// ############################################################################################################ Functions Casino ############################################################################################################ 

function face(cardValue) {
  if (cardValue === 'Jack' || cardValue === 'Queen' || cardValue === 'King') {
    cardValue = '10';
  } else if (cardValue === 'Ace') {
    cardValue = '11';
  }
  return parseInt(cardValue);
}

function get_emoji(cardNum) {
  switch (cardNum) {
    case 'Ace':
      return '🅰️';
    case '2':
      return '2️⃣';
    case '3':
      return '3️⃣';
    case '4':
      return '4️⃣';
    case '5':
      return '5️⃣';
    case '6':
      return '6️⃣';
    case '7':
      return '7️⃣';
    case '8':
      return '8️⃣';
    case '9':
      return '9️⃣';
    case '10':
      return '🔟';
    case 'Jack':
      return '🇯';
    case 'Queen':
      return '🇶';
    case 'King':
      return '🇰';
    default:
      return '';
  }
}

async function dealerDraw(dealerTotal, userData) {
  if (dealerTotal > 16) {
    return userData;
  } else if (dealerTotal < 17) {
    const vals = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    const suits = ['spades', 'clubs', 'hearts', 'diamonds'];
    const deck = vals.flatMap(val => suits.map(suit => [val, suit]));
    deck.sort(() => Math.random() - 0.5);
    const dealerCards = userData['dealer_cards'];
    dealerCards.push(deck[0][0]);
    userData['dealer_cards'] = dealerCards;
    dealerTotal += face(deck[0][0]);
    return await dealerDraw(dealerTotal, userData); // added 'return' here
  }
}

async function playerDraw(userData) {
  const vals = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
  const suits = ['spades', 'clubs', 'hearts', 'diamonds'];
  const deck = vals.flatMap(val => suits.map(suit => [val, suit]));
  deck.sort(() => Math.random() - 0.5);
  const playerCards = userData['player_cards'];
  playerCards.push(deck[0][0]);
  userData['player_cards'] = playerCards;
  return userData
}

function roulette_blackorred(bet_color) {
  const random_num = Math.floor(Math.random() * 3);
  if (bet_color === 'red' && random_num === 0) {
    return true;
  } else if (bet_color === 'black' && random_num === 1) {
    return true;
  } else {
    return false;
  }
}

function find_dice(number) {
  if (number === "E") {
    number = 11
  } else if (number === "T") {
    number = 10
  } else if (number === "W") {
    number = 12
  } else {
    number = parseInt(number)
  }
  return number
}

function dice_game(chance_to_land) {
    // Roll two dice
    let dice1 = Math.floor(Math.random() * 6) + 1;
    let dice2 = Math.floor(Math.random() * 6) + 1;
    let total = dice1 + dice2;

    // Add a 30% edge to be false
    const edge = Math.random() < 0.3;

    // If the edge is triggered, re-roll the dice until the total is different from the chance to land
    while (edge && total === chance_to_land) {
        dice1 = Math.floor(Math.random() * 6) + 1;
        dice2 = Math.floor(Math.random() * 6) + 1;
        total = dice1 + dice2;
    }

    // Check if user guess is correct
    if (total === chance_to_land && !edge) {
        return [true, total];
    } else {
        return [false, total];
    }
}

function shuffle(array) {
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}