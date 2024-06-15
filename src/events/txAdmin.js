const axios = require('axios');

let cookie, csrfToken;

async function init() {
    try {
        const response = await axios.post('http://127.0.0.1:40120/auth/password?uiVersion=7.1.0', {
            username: 'admin',
            password: 'w9gXq9e43StM4PRbMe64'
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