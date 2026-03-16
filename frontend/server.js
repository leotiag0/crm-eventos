const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
// Note: Se o .env estiver na raiz do projeto, o server.js dentro de 'frontend' 
// precisará de ajuda para achá-lo, ou o .env deve ser copiado para dentro de 'frontend'.
const API_URL = process.env.API_URL || 'http://localhost:8000';

// Configura o proxy para o backend PHP
app.use('/api', createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api',
    },
    onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        res.status(500).send('Erro na comunicação com o servidor de API.');
    }
}));

// Serve os arquivos estáticos (agora no mesmo nível ou abaixo)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback para SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Proxy configurado para: ${API_URL}`);
});
