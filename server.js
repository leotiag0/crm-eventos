const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:8000';

// Configura o proxy para o backend PHP
app.use('/api', createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api', // mantém o prefixo /api para o backend PHP
    },
    onProxyReq: (proxyReq, req, res) => {
        // Log para debug em produção se necessário
        console.log(`[Proxy] ${req.method} ${req.url} -> ${API_URL}${req.url}`);
    },
    onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        res.status(500).send('Erro na comunicação com o servidor de API.');
    }
}));

// Serve os arquivos estáticos do frontend (pasta dist na raiz após build)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback para SPA (Single Page Application)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Proxy configurado para: ${API_URL}`);
});
