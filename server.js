const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ==============================
// CONEXÃO COM O BANCO POSTGRESQL
// ==============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ==============================
// CRIAR TABELA AO INICIAR
// ==============================
async function criarTabela() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id        SERIAL PRIMARY KEY,
      cliente   TEXT NOT NULL,
      produto   TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      data_entrega DATE,
      status    TEXT DEFAULT 'pendente',
      observacoes TEXT,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ Tabela pedidos pronta!');
}
criarTabela();

// ==============================
// ROTAS
// ==============================

// Teste de vida
app.get('/', (req, res) => {
  res.json({ status: 'API rodando!', hora: new Date() });
});

// INSERIR pedido
app.post('/api/pedidos', async (req, res) => {
  const { cliente, produto, quantidade, data_entrega, status, observacoes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pedidos (cliente, produto, quantidade, data_entrega, status, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cliente, produto, quantidade, data_entrega, status || 'pendente', observacoes]
    );
    res.json({ ok: true, id: result.rows[0].id, pedido: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// LISTAR todos os pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// LISTAR pedidos com cálculos (view)
app.get('/api/pedidos/view', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vw_pedidos ORDER BY data_entrega ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// DELETAR pedido
app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pedidos WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API rodando na porta ${PORT}`));
