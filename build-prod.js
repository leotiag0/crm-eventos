const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to, skipFolders = []) {
    if (!fs.existsSync(from)) return;
    if (!fs.parse) { /* Polyfill or check if skipFolders is used */ }
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });

    fs.readdirSync(from).forEach(element => {
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);

        if (skipFolders.includes(element)) {
            console.log(`Pulando pasta ignorada: ${fromPath}`);
            return;
        }

        if (fs.lstatSync(fromPath).isDirectory()) {
            copyFolderSync(fromPath, toPath, skipFolders);
        } else {
            fs.copyFileSync(fromPath, toPath);
        }
    });
}

console.log('--- Iniciando consolidação de arquivos para produção ---');

// 1. Copia a pasta API (pulando pastas de dados persistentes e dependências)
console.log('Copiando pasta /api...');
copyFolderSync('api', 'dist/api', ['uploads', 'logs', 'vendor']);

// 2. Copia o server.js
console.log('Copiando server.js...');
fs.copyFileSync('server.js', 'dist/server.js');

// 3. Copia o package.json (raiz) para que a Hostinger saiba como iniciar o app
console.log('Copiando package.json...');
fs.copyFileSync('package.json', 'dist/package.json');

// 4. Garante que o server.js dentro de dist aponte para os arquivos locais
// No server.js original: app.use(express.static(path.join(__dirname, 'dist')));
// Se ele estiver DENTRO de dist, deve ser dist/.. ou apenas '.'
// Mas como a Hostinger achata a pasta 'dist' na raiz de deploy, o server.js 
// voltará a estar no mesmo nível da pasta dist/ (que vira a raiz).
// Portanto, mantemos a lógica ou ajustamos se necessário.

console.log('--- Consolidação concluída com sucesso! ---');
