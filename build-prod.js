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
copyFolderSync('api', 'dist/api', ['logs', 'vendor']);

// 2. Copia o server.js
console.log('Copiando server.js...');
fs.copyFileSync('server.js', 'dist/server.js');

// 3. Copia o package.json (raiz) para que a Hostinger saiba como iniciar o app
console.log('Copiando package.json...');
fs.copyFileSync('package.json', 'dist/package.json');

// 4. Inline CSS in index.html for better performance (eliminates render-blocking request)
console.log('Inlining CSS em index.html...');
const indexPath = 'dist/index.html';
if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Procura por tags <link rel="stylesheet" href="/assets/index-*.css">
    const cssMatch = html.match(/<link rel="stylesheet" [^>]*href="\/assets\/(index-[^"]+\.css)"[^>]*>/);
    
    if (cssMatch) {
        const cssFileName = cssMatch[1];
        const cssPath = path.join('dist/assets', cssFileName);
        
        if (fs.existsSync(cssPath)) {
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            console.log(`Inlining ${cssFileName} (${(cssContent.length / 1024).toFixed(2)} KB)...`);
            
            // Substitui a tag <link> pelo conteúdo <style>
            html = html.replace(cssMatch[0], `<style>${cssContent}</style>`);
            
            // 5. Adiciona modulepreload para o JS principal (melhora LCP)
            const jsMatch = html.match(/<script type="module" [^>]*src="\/assets\/(index-[^"]+\.js)"[^>]*>/);
            if (jsMatch) {
                const jsFileName = jsMatch[1];
                const preloadTag = `<link rel="modulepreload" href="/assets/${jsFileName}">`;
                html = html.replace('</title>', `</title>\n  ${preloadTag}`);
            }

            fs.writeFileSync(indexPath, html);
        }
    }
}

console.log('--- Consolidação concluída com sucesso! ---');
