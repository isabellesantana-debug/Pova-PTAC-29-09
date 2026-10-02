import express from "express";
import { readProducts, readUsers, writeUsers } from "./db.js";

const app = express();
app.use(express.json());
const PORT = 3000;

app.get('/', (req, res) => {
    res.json({message: 'A API está On!'})
})

app.get("/users", async (req, res) => {
  const { maior } = req.query;
  let users = await readUsers();
  if (maior) {
    users = users.filter((u) => u.idade > Number(maior));
  }
  res.json(users);
});

app.get("/users/:id", async (req, res) => {
  const users = await readUsers();
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });
  res.json(user);
});

app.post("/users", async (req, res) => {
  const { nome, email } = req.body || {};

  // validação simples
  if (!nome || typeof nome !== "string") {
    return res.status(400).json({ erro: "nome é obrigatório" });
  }
  if (!email || !email.includes("@")) {
    return res.status(400).json({ erro: "email inválido" });
  }

  const users = await readUsers();
  const novoId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;

  const novo = { id: novoId, nome, email };
  users.push(novo);
  await writeUsers(users);

  
  res.status(201).json(novo);
});

app.post("/users/batch", async (req, res) => {
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

app.put('/users/:id', async (req, res) => {
  const id = Number(req.params.id)
  
  const { nome, email } = req.body || {}

  if (!nome || !email) {
    return res.status(400).json({ 
      erro: 'nome e email são obrigatórios para PUT (substituição completa)' 
    })
  }

  const users = await readUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return res.status(404).json({ erro: 'Usuário não encontrado' })

  users[idx] = { id, nome, email }
  
  await writeUsers(users)
  res.json(users[idx])  // 200 OK
})

app.patch('/users/:id', async (req, res) => {
  const id = Number(req.params.id)
  const users = await readUsers()
  const user = users.find(u => u.id === id)
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' })

  const { id: _, createdAt: __, updatedAt: ___, ...dadosPermitidos } = req.body || {}
  console.log(req.body)
  Object.assign(user, dadosPermitidos)

  user.updatedAt = new Date().toISOString()
  
  
  await writeUsers(users)
  res.json(user)  
})

app.delete('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const users = await readUsers();
  const user = users.findIndex((u) => u.id === id);
  if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });

  user.deletedAt = new Date().toISOString();
  await writeUsers(users);
  res.status(204).json({ message: "Usuário removido com sucesso" });
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