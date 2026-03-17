const express = require("express");
const mssql = require("mssql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();


const app = express();
const PORT = process.env.PORT || 3000;
const connectionString = process.env.CONNECTION_STRING;

app.use(cors());
app.use(express.json());

// Conectar ao banco
async function conectaBD() {
    try {
        await mssql.connect(connectionString);
        console.log("Conectado ao banco de dados SQL Server.");
    } catch (error) {
        console.error("Erro na conexão com o banco de dados:", error);
    }
}
conectaBD();

async function execQuery(query, params = {}) {
    try {
        const request = new mssql.Request();
        for (let key in params) {
            request.input(key, params[key]);
        }
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error("Erro ao executar a consulta SQL:", error);
        throw error;
    }
}

// Criar novo usuário
app.post('/users', async (req, res) => {
    const { nome, sobrenome, email, senha, data_nascimento } = req.body;
    const dataFormatada = new Date(data_nascimento).toISOString().split("T")[0];


    try {
        // Hash da senha
        const hashedPassword = await bcrypt.hash(senha, 10);

        const query = `
            INSERT INTO NutriFit_users (nome, sobrenome, email, senha, data_nascimento)
            VALUES (@nome, @sobrenome, @email, @senha, @data_nascimento);
        `;

        await execQuery(query, {
            nome,
            sobrenome,
            email,
            senha: hashedPassword,
            data_nascimento: dataFormatada
        });

        res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao criar usuário.", error });
    }
});


// Obter todos os usuários
app.get('/users', async (req, res) => {
    try {
        const query = `SELECT * FROM NutriFit_users`;
        const users = await execQuery(query);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar usuários.", error });
    }
});

// Obter usuário por e-mail
app.get('/users/:email', async (req, res) => {
    const { email } = req.params;
    const query = `SELECT * FROM NutriFit_users WHERE email = @email`;
    try {
        const users = await execQuery(query, { email });
        if (users.length === 0) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }
        res.status(200).json(users[0]);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar usuário.", error });
    }
});

// Atualizar usuário
app.put('/users/:email', async (req, res) => {
    const { email } = req.params;
    const { nome, sobrenome, senha, data_nascimento } = req.body;
    const query = `
        UPDATE NutriFit_users
        SET nome = @nome, sobrenome = @sobrenome, senha = @senha, data_nascimento = @data_nascimento
        WHERE email = @email;
    `;
    try {
        await execQuery(query, { nome, sobrenome, senha, data_nascimento, email });
        res.status(200).json({ message: "Usuário atualizado com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar usuário.", error });
    }
});

// Excluir usuário
app.delete('/users/:email', async (req, res) => {
    const { email } = req.params;
    const query = `DELETE FROM NutriFit_users WHERE email = @email`;
    try {
        await execQuery(query, { email });
        res.status(200).json({ message: "Usuário excluído com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao excluir usuário.", error });
    }
});

// Login do usuário
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    const query = `SELECT * FROM NutriFit_users WHERE email = @email`;

    try {
        const users = await execQuery(query, { email });

        if (users.length === 0) {
            return res.status(401).json({ message: "Email ou senha inválidos." });
        }

        const user = users[0];

        const senhaCorreta = await bcrypt.compare(senha, user.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ message: "Email ou senha inválidos." });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { email: user.email, nome: user.nome },
            process.env.JWT_SECRET || "segredo_super_secreto",
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login realizado com sucesso!",
            token,
            user: {
                nome: user.nome,
                sobrenome: user.sobrenome,
                email: user.email,
                data_nascimento: user.data_nascimento
            }
        });

    } catch (error) {
        console.error("Erro ao realizar login:", error);
        res.status(500).json({ message: "Erro ao realizar login.", error: error.message || error });
    }
});
//Inserir alimentos
app.post('/alimentos', async (req, res) => {
    const {
        nome,
        categoria,
        quantidade_porção,
        unidade_medida,
        calorias,
        proteinas,
        carboidratos,
        gorduras,
        fibras,
        sodio
    } = req.body;

    try {
        const query = `
            INSERT INTO Alimentos (nome, categoria, quantidade_porção, unidade_medida, calorias, proteinas, carboidratos, gorduras, fibras, sodio)
            VALUES (@nome, @categoria, @quantidade_porção, @unidade_medida, @calorias, @proteinas, @carboidratos, @gorduras, @fibras, @sodio);
        `;

        await execQuery(query, {
            nome,
            categoria,
            quantidade_porção,
            unidade_medida,
            calorias,
            proteinas,
            carboidratos,
            gorduras,
            fibras,
            sodio
        });

        res.status(201).json({ message: "Alimento criado com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao criar alimento.", error });
    }
});

// Obter todos os alimentos
app.get('/alimentos', async (req, res) => {
    try {
        const query = `SELECT * FROM Alimentos`;
        const alimentos = await execQuery(query);
        res.status(200).json(alimentos);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar alimentos.", error });
    }
});

// Obter alimento por nome
app.get('/alimentos/:nome', async (req, res) => {
    const { nome } = req.params;
    const query = `SELECT * FROM Alimentos WHERE nome = @nome`;
    try {
        const alimentos = await execQuery(query, { nome });
        if (alimentos.length === 0) {
            return res.status(404).json({ message: "Alimento não encontrado." });
        }
        res.status(200).json(alimentos[0]);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar alimento.", error });
    }
});

// Atualizar alimento
app.put('/alimentos/:id', async (req, res) => {
    const { id } = req.params;
    const {
        nome,
        categoria,
        quantidade_porção,
        unidade_medida,
        calorias,
        proteinas,
        carboidratos,
        gorduras,
        fibras,
        sodio
    } = req.body;

    const query = `
        UPDATE Alimentos
        SET nome = @nome, categoria = @categoria, quantidade_porção = @quantidade_porção, unidade_medida = @unidade_medida, 
            calorias = @calorias, proteinas = @proteinas, carboidratos = @carboidratos, gorduras = @gorduras, 
            fibras = @fibras, sodio = @sodio
        WHERE id = @id;
    `;
    try {
        await execQuery(query, {
            nome,
            categoria,
            quantidade_porção,
            unidade_medida,
            calorias,
            proteinas,
            carboidratos,
            gorduras,
            fibras,
            sodio,
            id
        });
        res.status(200).json({ message: "Alimento atualizado com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar alimento.", error });
    }
});

// Excluir alimento
app.delete('/alimentos/:id', async (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM Alimentos WHERE id = @id`;
    try {
        await execQuery(query, { id });
        res.status(200).json({ message: "Alimento excluído com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao excluir alimento.", error });
    }
});


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
