const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAPI() {
    try {
        // 1. Prova il login
        console.log('Tentativo di login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'test@esempio.com',
            password: 'Test123!'
        });
        
        const token = loginResponse.data.token;
        console.log('Login effettuato, token ricevuto');

        // 2. Prova a ottenere i pasti con il token
        console.log('\nRichiedo i pasti di oggi...');
        const mealsResponse = await axios.get(`${API_URL}/meals/2025-09-08`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Risposta pasti:', mealsResponse.data);
    } catch (error) {
        if (error.response) {
            console.error('Errore:', error.response.data);
        } else {
            console.error('Errore:', error.message);
        }
    }
}

testAPI();
