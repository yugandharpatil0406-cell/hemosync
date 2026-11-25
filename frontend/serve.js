const { spawn } = require('child_process');
const path = require('path');

const vite = spawn('npx.cmd', ['vite', '--port', '5173', '--host'], {
  cwd: __dirname,
  stdio: ['ignore', 'inherit', 'inherit'],
  shell: true
});

vite.on('exit', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGINT', () => vite.kill('SIGINT'));
process.on('SIGTERM', () => vite.kill('SIGTERM'));
