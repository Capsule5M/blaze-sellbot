const axios = require('axios');

let cookie, csrfToken;

async function init() {
    try {
        const response = await axios.post('http://'+process.env.TX_ENDPOINT+'/auth/password?uiVersion='+process.env.TX_VERSION+'', {
            username: process.env.TX_USERNAME,
            password: process.env.TX_PASSWORD
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'accept': '*/*'
            }
        });
        cookie = response.headers['set-cookie'];
        csrfToken = response.data.csrfToken;
        console.log('Initialisation du cookie et du token txAdmin');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du cookie et du token txAdmin.', error);
    }
}

init();

setInterval(init, 12 * 60 * 60 * 1000); 

module.exports = {
    getCookie: () => cookie,
    getCsrfToken: () => csrfToken
};