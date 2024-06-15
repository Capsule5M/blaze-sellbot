const { ActivityType } = require("discord.js");
const mongoose = require('mongoose');
const mongodbURL = process.env.MONGOURL;

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('Ready!');

        client.user.setPresence({activities: [{ name: process.env.PRESENCE_TEXT, type: ActivityType.Watching }]});
        client.user.setStatus('dnd');

        if (!mongodbURL) return;
        mongoose.set('strictQuery', true);
        mongoose.connect(mongodbURL, { keepAlive: true, useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('Connected to the MongoDB database.');
        }).catch((err) => {
            console.error(err.message);
            process.exit(1);
        });

        async function pickPresence () {
            const option = Math.floor(Math.random() * statusArray.length);

            try {
                await client.user.setPresence({
                    activities: [
                        {
                            name: statusArray[option].content,
                            type: statusArray[option].type,

                        },
                    
                    ],

                    status: statusArray[option].status
                })
            } catch (error) {
                console.error(error);
            }
        }
    },
};