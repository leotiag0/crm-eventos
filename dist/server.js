const express = require('express');
const fs = require('fs');
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

// Determina o diretório de arquivos estáticos (prod vs local)
const staticPath = fs.existsSync(path.join(__dirname, 'dist'))
    ? path.join(__dirname, 'dist')
    : __dirname;

console.log(`[Static] Servindo arquivos de: ${staticPath}`);

// Serve os arquivos estáticos
app.use(express.static(staticPath));

// Fallback para SPA (Single Page Application)
app.get('*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend não encontrado (index.html ausente).');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Proxy configurado para: ${API_URL}`);
});
