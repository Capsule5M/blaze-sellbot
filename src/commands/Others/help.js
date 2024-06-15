const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
accountsSchema = require('../../Schemas.js/accounts');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Permets de voir un guide d'utilisation des services du bot Modern.")
	.setDMPermission(false),
    async execute (interaction) {
        const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('myaccounthelp')
					.setLabel("Modern\'Store")
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('1211052334256488469'),
				new ButtonBuilder()
                    .setURL('https://store.modern5m.com')
					.setLabel('Store')
					.setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setURL('https://modern5m.com')
					.setLabel('Site')
					.setStyle(ButtonStyle.Link),
				new ButtonBuilder()
                    .setURL('https://wiki.modern5m.com')
					.setLabel('Wiki')
					.setStyle(ButtonStyle.Link),
			);

        const embed = new EmbedBuilder()
        	.setColor(0x8200e9)
			.setTitle('Guide d\'utilisation du bot Modern.')
			.setDescription('Nous avons **mis en place** une **solution efficace** et **centralisée** permettant aux utilisateurs de **contribuer au projet**.\n```fix\nGuide Général```\n<a:flechedroite:1089668816621011107>  Nous utilisons les **Diamants** <a:diamondmodern:1209541241524584528> comme forme de "coin". Vous pouvez **consulter le nombre actuel** de Diamants que **vous possédez**, en **acquérir** et les **injecter** en utilisant le boutton ``Modern\'Store``. Ce boutton vous **permettera d\'accéder** à votre **compte donateur** ou vous pourrez accédez aux **différentes offres, les vip, les Diamants, les codes créateurs, et l\'accès aux mini-jeux**. N\'oublier pas de **lier votre email** via le bouton ``Lier L\'email`` avant de pouvoir faire une donation.\n\n<a:flechedroite:1089668816621011107>  Une fois que vous avez **acquis des Diamants**, vous pouvez décider de les **garder sur Discord** ou de les **injecter dans la boutique in-game** de notre serveur de jeu en utilisant le boutton ``Transferer IG`` sur le boutton ``Modern\'Store``. Attention, l\'action **d\'injection est irréversible** !\n\n<a:flechedroite:1089668816621011107>  Le vip est un **abonnement mensuel** permet d\'avoir **différents avantages** en jeux. Il y a **plusieurs catégorie** de vip. Il est obtenable via le bouton ``Modern\'Store`` dans la **catégorie donnation**.\n\n```fix\nGuide Boutique```\n<a:flechedroite:1089668816621011107>  Le bot **Modern** offre une méthode **entièrement automatisée** pour traiter les dons sur le serveur. Vous pouvez **utiliser notre bot** pour les **paiements** par **Carte Bancaire/Paypal/Crypto, ou Pcs/Paysafecard**.\n\n```fix\nGuide Mini-jeu```\n<a:flechedroite:1089668816621011107>  Nous offrons la possibilité d\'essayer de **multiplier vos Diamants** avant de les injecter in-game grâce à une liste de **divers mini-jeux** tels que le ``blackjack``, ``roulette`` et ``dice``. Ces jeux sont accessible via le boutton `Modern\'Store`. Veuillez noter que des **conditions s\'appliquent et sont affichées lors de l\'utilisation des commandes**.')			.setTimestamp();
        await interaction.reply({components: [row], embeds:[embed]})
    }
};