const express = require('express');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:8000';

// Serve a pasta de uploads diretamente (evita que imagens sumam no build/proxy)
// Tenta servir tanto da raiz quanto de dentro de /dist para maior compatibilidade
app.use('/api/uploads', express.static(path.join(__dirname, 'api/uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'dist/api/uploads')));

// Fallback para evitar que arquivos não encontrados em uploads caiam no proxy da API
app.use('/api/uploads', (req, res) => {
    res.status(404).send('Arquivo não encontrado');
});

// Configura o proxy para o backend PHP
app.use('/api', createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api', // mantém o prefixo /api para o backend PHP
    },
    onProxyReq: (proxyReq, req, res) => {
        // Passa variáveis de ambiente para o PHP via headers (sync entre Node e PHP na Hostinger)
        const envVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_PASSWORD', 'DB_CHARSET', 'API_URL', 'APP_ENV'];
        envVars.forEach(v => {
            if (process.env[v]) {
                proxyReq.setHeader(`X-App-${v}`, process.env[v]);
            }
        });

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
