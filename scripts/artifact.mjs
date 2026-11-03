// Convierte dist-artifact/index.html en contenido para publicar como página de Claude (sin <html>/<head>/<body> propios)
import { readFileSync, writeFileSync } from 'node:fs';
const s = readFileSync('dist-artifact/index.html', 'utf8');
const head = s.match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<meta charset[^>]*>/, '').replace(/<meta name="viewport"[^>]*>/, '')
  .replace(/<link rel="icon"[^>]*>/, '').replace(/<link rel="apple-touch-icon"[^>]*>/, '');
const body = s.match(/<body>([\s\S]*?)<\/body>/)[1];
// el <title> primero
const title = head.match(/<title>[\s\S]*?<\/title>/)[0];
writeFileSync('dist-artifact/mi-ciclo.html', title + '\n' + head.replace(title, '') + '\n' + body);
console.log('ok', (title + head + body).length);
