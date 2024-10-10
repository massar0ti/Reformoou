const axios = require('axios');

// Chave de API do OpenRouteService
const ORS_API_KEY = '5b3ce3597851110001cf62484896d3bf6c09439da3c17dab4f199072'; // Substitua com sua chave de API

// Função para obter a distância entre duas coordenadas usando OpenRouteService
async function getDistanceBetweenCoordinates(coords1, coords2) {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${coords1.longitude},${coords1.latitude}&end=${coords2.longitude},${coords2.latitude}&format=json&units=km`;
    console.log(`Solicitando distância entre ${coords1.latitude},${coords1.longitude} e ${coords2.latitude},${coords2.longitude}`);
    try {
        const response = await axios.get(url);
        console.log('Resposta da API:', response.data); // Adicionando log para ver a resposta completa
        const data = response.data;
        if (data.routes && data.routes.length > 0) {
            const distance = data.routes[0].summary.distance / 1000; // Distância em quilômetros
            console.log(`A distância entre as coordenadas é ${distance.toFixed(2)} km`);
            return distance;
        } else {
            console.warn('Nenhuma rota encontrada. Verifique as coordenadas e a chave da API.');
            return null;
        }
    } catch (error) {
        console.error(`Erro ao obter distância: ${error.response ? error.response.data.error : error.message}`);
        return null;
    }
}

async function main() {
    // Substitua por coordenadas conhecidas para teste
    const coords1 = { latitude: -23.532918, longitude: -46.830942 }; // Coordenadas de exemplo
    const coords2 = { latitude: -23.534254, longitude: -46.835473 }; // Coordenadas de exemplo

    // Obter a distância entre as coordenadas
    await getDistanceBetweenCoordinates(coords1, coords2);
}

main();
