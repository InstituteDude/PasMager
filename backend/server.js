const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const vaultRoutes = require('./routes/vault');
const financeRoutes = require('./routes/finance');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:3000'];
const configuredOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
const allowedOrigins = [...defaultOrigins, ...configuredOrigins];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/finance', financeRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Password & Bank Manager Vault API', timestamp: new Date() });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 [CyberVault Backend] Server running on http://localhost:${PORT}`);
});
