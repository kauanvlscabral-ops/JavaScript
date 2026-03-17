const axios = require('axios');

// Exemplo: buscar um produto por nome
async function buscarProduto(nome) {
  const query = encodeURIComponent(nome);
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1`;

  try {
    const response = await axios.get(url);
    const produtos = response.data.products;

    if (produtos.length === 0) {
      console.log("Nenhum produto encontrado.");
      return;
    }

    produtos.slice(0, 3).forEach((produto, i) => {
      console.log(`\nProduto ${i + 1}: ${produto.product_name}`);
      console.log(`Kcal: ${produto.nutriments['energy-kcal_100g']} kcal/100g`);
      console.log(`Carboidratos: ${produto.nutriments.carbohydrates_100g} g/100g`);
      console.log(`Proteínas: ${produto.nutriments.proteins_100g} g/100g`);
      console.log(`Gorduras: ${produto.nutriments.fat_100g} g/100g`);
    });
  } catch (error) {
    console.error("Erro ao buscar produto:", error.message);
  }
}

buscarProduto("bisnaguinha ");

require('dotenv').config();
const express = require('express');
const sql = require('mssql');

const app = express();
app.use(express.json());

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// Conectar ao banco de dados
sql.connect(config).then(pool => {
  app.locals.db = pool;
  console.log('Conectado ao banco de dados');
}).catch(err => {
  console.error('Erro ao conectar ao banco de dados:', err);
});

// Rota para adicionar um alimento
app.post('/alimentos', async (req, res) => {
  const { nome, marca, kcal, carboidratos, proteinas, gorduras, quantidade } = req.body;

  try {
    const result = await req.app.locals.db.request()
      .input('nome', sql.NVarChar, nome)
      .input('marca', sql.NVarChar, marca)
      .input('kcal', sql.Decimal, kcal)
      .input('carboidratos', sql.Decimal, carboidratos)
      .input('proteinas', sql.Decimal, proteinas)
      .input('gorduras', sql.Decimal, gorduras)
      .input('quantidade', sql.Int, quantidade)
      .query(`
        INSERT INTO Alimentos (nome, marca, kcal, carboidratos, proteinas, gorduras, quantidade)
        VALUES (@nome, @marca, @kcal, @carboidratos, @proteinas, @gorduras, @quantidade)
      `);
    res.status(201).json({ message: 'Alimento adicionado com sucesso!' });
  } catch (err) {
    console.error('Erro ao adicionar alimento:', err);
    res.status(500).json({ error: 'Erro ao adicionar alimento' });
  }
});

// Rota para listar todos os alimentos
app.get('/alimentos', async (req, res) => {
  try {
    const result = await req.app.locals.db.request().query('SELECT * FROM Alimentos');
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Erro ao listar alimentos:', err);
    res.status(500).json({ error: 'Erro ao listar alimentos' });
  }
});

// Rota para editar um alimento
app.put('/alimentos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, marca, kcal, carboidratos, proteinas, gorduras, quantidade } = req.body;

  try {
    const result = await req.app.locals.db.request()
      .input('id', sql.Int, id)
      .input('nome', sql.NVarChar, nome)
      .input('marca', sql.NVarChar, marca)
      .input('kcal', sql.Decimal, kcal)
      .input('carboidratos', sql.Decimal, carboidratos)
      .input('proteinas', sql.Decimal, proteinas)
      .input('gorduras', sql.Decimal, gorduras)
      .input('quantidade', sql.Int, quantidade)
      .query(`
        UPDATE Alimentos
        SET nome = @nome, marca = @marca, kcal = @kcal, carboidratos = @carboidratos,
            proteinas = @proteinas, gorduras = @gorduras, quantidade = @quantidade
        WHERE id = @id
      `);
    res.status(200).json({ message: 'Alimento atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar alimento:', err);
    res.status(500).json({ error: 'Erro ao atualizar alimento' });
  }
});

app.post('/buscar-e-adicionar', async (req, res) => {
    const { nome } = req.body;
  
    // Faz a busca na API do OpenFoodFacts
    const query = encodeURIComponent(nome);
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1`;
  
    try {
      const response = await axios.get(url);
      const produtos = response.data.products;
  
      if (!produtos || produtos.length === 0) {
        return res.status(404).json({ message: "Nenhum produto encontrado." });
      }
  
      // Pega o primeiro produto encontrado
      const produto = produtos[0];
  
      // Pega os dados que você quer salvar (cuidado com dados faltantes)
      const nomeProduto = produto.product_name || 'Nome não disponível';
      const marca = produto.brands || 'Marca não disponível';
  
      // Alguns campos nutricionais podem não existir, então coloque 0 como default
      const kcal = produto.nutriments['energy-kcal_100g'] || 0;
      const carboidratos = produto.nutriments.carbohydrates_100g || 0;
      const proteinas = produto.nutriments.proteins_100g || 0;
      const gorduras = produto.nutriments.fat_100g || 0;
      const quantidade = 100; // por exemplo, padrão 100g, ou você pode adaptar
  
      // Insere no banco de dados
      await req.app.locals.db.request()
        .input('nome', sql.NVarChar, nomeProduto)
        .input('marca', sql.NVarChar, marca)
        .input('kcal', sql.Decimal, kcal)
        .input('carboidratos', sql.Decimal, carboidratos)
        .input('proteinas', sql.Decimal, proteinas)
        .input('gorduras', sql.Decimal, gorduras)
        .input('quantidade', sql.Int, quantidade)
        .query(`
          INSERT INTO Alimentos (nome, marca, kcal, carboidratos, proteinas, gorduras, quantidade)
          VALUES (@nome, @marca, @kcal, @carboidratos, @proteinas, @gorduras, @quantidade)
        `);
  
      res.status(201).json({ message: 'Produto buscado e salvo no banco com sucesso!' });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar e salvar o produto.' });
    }
  });
  


// Rota para remover um alimento
app.delete('/alimentos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await req.app.locals.db.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Alimentos WHERE id = @id');
    res.status(200).json({ message: 'Alimento removido com sucesso!' });
  } catch (err) {
    console.error('Erro ao remover alimento:', err);
    res.status(500).json({ error: 'Erro ao remover alimento' });
  }
});

// Iniciar o servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
