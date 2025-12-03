#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Кроссплатформенная функция копирования директории
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const standaloneDir = path.join(process.cwd(), '.next/standalone');
const publicDir = path.join(process.cwd(), 'public');
const staticDir = path.join(process.cwd(), '.next/static');

if (!fs.existsSync(path.join(standaloneDir, 'server.js'))) {
  console.error('Standalone сборка не найдена. Запустите "npm run build" сначала.');
  process.exit(1);
}

const standalonePublic = path.join(standaloneDir, 'public');
if (!fs.existsSync(standalonePublic) && fs.existsSync(publicDir)) {
  console.log(' Копирование public файлов...');
  copyDir(publicDir, standalonePublic);
}

const standaloneStatic = path.join(standaloneDir, '.next/static');
if (!fs.existsSync(standaloneStatic) && fs.existsSync(staticDir)) {
  console.log('Копирование static файлов...');
  const standaloneNext = path.join(standaloneDir, '.next');
  if (!fs.existsSync(standaloneNext)) {
    fs.mkdirSync(standaloneNext, { recursive: true });
  }
  copyDir(staticDir, standaloneStatic);
}

console.log('Запуск standalone сервера...');
process.chdir(standaloneDir);
execSync('node server.js', { stdio: 'inherit' });

