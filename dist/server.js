const express = require('express');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:8000';

// Configuração de cache para arquivos estáticos
const setCustomCacheControl = (res, path) => {
    // Arquivos do Vite (JS, CSS no diretório assets) têm hash e podem ter cache longo
    if (path.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|woff2|webp)$/)) {
        // Imagens e fontes em geral
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 dias
    }
};

// Serve a pasta de uploads diretamente
app.use('/api/uploads', express.static(path.join(__dirname, 'api/uploads'), {
    maxAge: '365d', // Aumentado para 365 dias
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
}));
app.use('/api/uploads', express.static(path.join(__dirname, 'dist/api/uploads'), {
    maxAge: '365d',
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
}));

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

// Serve os arquivos estáticos com cache otimizado
app.use(express.static(staticPath, {
    maxAge: '365d', // Mudado de 1d para 365d
    setHeaders: (res, path) => {
        // Hashed assets (Vite)
        if (path.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (path.endsWith('index.html')) {
            // NEVER cache index.html to ensure users always get the latest bundle hash
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else {
            // Other files (icons, robots.txt, etc)
            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for minor root files
        }
    }
}));

// Fallback para SPA (Single Page Application)
app.get('*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend não encontrado (index.html ausente).');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Proxy configurado para: ${API_URL}`);
});
