import { spawn } from 'child_process';
import http from 'http';

console.log('🚀 Démarrage du Déploiement Public Mondial...');

const serverProc = spawn('node', ['server.js'], { stdio: 'inherit' });

setTimeout(() => {
  console.log('🌐 Connexion au réseau public international...');
  const tunnel = spawn('cmd.exe', ['/c', 'ssh -o StrictHostKeyChecking=no -R 80:localhost:4000 nokey@localhost.run'], { stdio: 'pipe' });

  tunnel.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(text);
  });

  tunnel.stderr.on('data', (data) => {
    console.log(data.toString());
  });
}, 2000);
