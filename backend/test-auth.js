const axios = require('axios');

async function testAuth() {
    try {
        // Prima registriamo l'utente
        console.log('Tentativo di registrazione...');
        const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
            email: 'test@esempio.com',
            password: 'Test123!',
            name: 'Test User'
        });
        console.log('Registrazione:', registerResponse.data);
    } catch (registerError) {
        console.log('Errore registrazione:', registerError.response?.data || registerError.message);
    }

    try {
        // Poi proviamo il login
        console.log('\nTentativo di login...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'test@esempio.com',
            password: 'Test123!'
        });
        console.log('Login:', loginResponse.data);
    } catch (loginError) {
        console.log('Errore login:', loginError.response?.data || loginError.message);
    }
}

testAuth();
