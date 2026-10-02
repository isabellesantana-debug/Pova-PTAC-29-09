import express from "express";
import { readProducts, readUsers, writeUsers } from "./db.js";

const app = express();
app.use(express.json());
const PORT = 3000;

app.get('/', (req, res) => {
    res.json({'message': 'API esta funcionando corretamente!'})
})

app.get("/nomeAluno", async (req, res) => {
  const { maior } = req.query;
  let users = await readUsers();
  if (maior) {
    users = nomeAluno.filter((u) => u.livro > Number(maior));
  }
  res.json(nomeAluno);
});

app.get("/nomeAluno/:id", async (req, res) => {
  const users = await readUsers();
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ erro: "Nome do aluno não encontrado" });
  res.json(user);
});

app.post("/nomeAluno", async (req, res) => {
  const { nome, livro } = req.body || {};


  if (!nome || typeof nome !== "string") {
    return res.status(400).json({ erro: "nome é obrigatório" });
  }
  if (!livro || typeof livro !== "string") {
    return res.status(400).json({ erro: "livro é obrigatório" });
  }

  const users = await readUsers();
  const novoId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;

  const novo = { id: novoId, nome, livro: null };
  users.push(novo);
  await writeUsers(users);

  
  res.status(201).json(novo);
});

app.post("/nomeAluno/batch", async (req, res) => {
  const usersBody = req.body || {};
  console.log("Batch Users: ", usersBody);

  const users = await readUsers();
  let biggestId = users.length ? Math.max(...users.map((u) => u.id)) : 0;
  const validUsers = usersBody 
    .filter(
      (u) =>
        u.nome &&
        typeof u.nome === "string" &&
        u.email &&
        u.email.includes("@"),
    )
    .map((u) => ({
      ...u,
      id: ++biggestId,
    }));
  console.log("Valid Users: ", validUsers);
  if (validUsers.length === 0) {
    return res.status(400).json({ erro: "dados inválidos" });
  }
  if (validUsers.length < usersBody.length) {
    return res
      .status(400)
      .json({ erro: "nem todos os usuários foram cadastrados" });
  }

  const newUsers = [...users, ...validUsers];
  await writeUsers(newUsers);

  res.status(201).json(validUsers);
});

app.put('/nomeAluno/:id', async (req, res) => {
  const id = Number(req.params.id)
  
  const { nome, livro } = req.body || {}

  if (!nome || !livro) {
    return res.status(400).json({ 
      erro: 'nome e livro são obrigatórios para PUT (substituição completa)' 
    })
  }

  const users = await readUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return res.status(404).json({ erro: 'Nome do aluno não encontrado' })

  users[idx] = { id, nome, livro, createdAt: users[idx].createdAt, updatedAt: new Date().toISOString() }
  
  await writeUsers(users)
  res.json(users[idx])  
})

app.patch('/nomeAluno/:id', async (req, res) => {
  const id = Number(req.params.id)
  const users = await readUsers()
  const user = users.find(u => u.id === id)
  if (!user) return res.status(404).json({ erro: 'Nome do aluno não encontrado' })

  const { id: _, createdAt: __, updatedAt: ___, ...dadosPermitidos } = req.body || {}
  console.log(req.body)
  Object.assign(user, dadosPermitidos)

  user.updatedAt = new Date().toISOString()
  
  
  await writeUsers(users)
  res.json(user)  
})

app.delete('/nomeAluno/:id', async (req, res) => {
  const id = Number(req.params.id);
  const users = await readUsers();
  const user = users.findIndex((u) => u.id === id);
  if (!user) return res.status(404).json({ erro: "Nome do aluno não encontrado" });

  user.deletedAt = new Date().toISOString();
  await writeUsers(users);
  res.status(204).json({ message: "Nome do aluno removido com sucesso" });
  
  user.deletedAt = new Date().toISOString();
  await writeUsers(users);
  res.status(204).json({ message: "livro removido com sucesso" });
});

app.get("/products", async (req, res) => {
  const { min } = req.query;
  let products = await readProducts();
  if (min) {
    const minPrice = parseFloat(min);
    products = products.filter((p) => p.price >= minPrice);
  }
  res.json(products);
});

app.get("/products/:id", async (req, res) => {
  const products = await readProducts();
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`),
);