#!/usr/bin/env node
/**
 * Aponta EXPO_PUBLIC_API_URL (no .env) para o IP desta máquina na rede local.
 *
 *   npm run setup:env            → usa o IP da LAN e a porta 8000
 *   npm run setup:env -- 8080    → outra porta
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(raiz, '.env');
const porta = process.argv[2] ?? '8000';

const ip =
    Object.values(networkInterfaces())
        .flat()
        .find((i) => i && i.family === 'IPv4' && !i.internal)?.address ?? '127.0.0.1';

if (!existsSync(envPath)) copyFileSync(join(raiz, '.env.example'), envPath);

const url = `http://${ip}:${porta}`;
let conteudo = readFileSync(envPath, 'utf8');
conteudo = /^EXPO_PUBLIC_API_URL=.*$/m.test(conteudo)
    ? conteudo.replace(/^EXPO_PUBLIC_API_URL=.*$/m, `EXPO_PUBLIC_API_URL=${url}`)
    : `${conteudo}\nEXPO_PUBLIC_API_URL=${url}\n`;
writeFileSync(envPath, conteudo);
console.log(`✔ EXPO_PUBLIC_API_URL=${url} gravado em .env`);
