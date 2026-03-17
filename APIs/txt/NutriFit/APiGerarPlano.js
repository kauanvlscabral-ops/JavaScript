
const axios = require('axios');
require('dotenv').config();

const CHATVOLT_API_KEY = process.env.CHATVOLT_API_KEY;
const AGENT_ID = process.env.CHATVOLT_AGENT_ID; // ID do agente configurado na plataforma Chatvolt

async function gerarPlanoAlimentar(dadosUsuario) {
  try {
    const response = await axios.post(
      `https://api.chatvolt.ai/agents/${AGENT_ID}/query`,
      {
        query: `Gere um plano alimentar baseado nos seguintes dados: ${JSON.stringify(dadosUsuario)}`,
        temperature: 0.2,
        streaming: false,
        visitorId: "KauanAna" 
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHATVOLT_API_KEY}`
        }
      }
    );

    return response.data.answer;
  } catch (error) {
    console.error('Erro ao gerar plano alimentar com Chatvolt:', error.response?.data || error.message);
    return 'Erro ao gerar plano alimentar.';
  }
}

// Exemplo de uso:
const dadosExemplo = {
  historico: "Café: leite com achocolatado e 1 pao frances com margarina, almoço: arroz, feijão, salsicha, farofa, janta: arroz, feijão, salsicha, farofa.",
  tmb: 2200,
  sexo: "masculino",
  objetivo: "emagrecer",
  preferencias: "não gosta de cebola"
};

gerarPlanoAlimentar(dadosExemplo).then(resposta => {
  console.log("Resposta do Chatvolt:");
  console.log(resposta);
});
