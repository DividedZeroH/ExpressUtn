// dev-start.js
// Arranca el entorno de desarrollo paso a paso:
//   1. Detecta la plataforma de ejecución (Windows / macOS / Linux / WSL)
//   2. Localiza Docker según la plataforma
//   3. Levanta el contenedor de la base de datos
//   4. Espera a que esté saludable
//   5. Instala dependencias Node en el entorno correcto
//   6. Muestra los comandos manuales adaptados a la plataforma

import { execSync, spawn } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetDir  = path.join(__dirname, 'app');

const C = {
  reset:  '\x1b[0m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  bold:   '\x1b[1m',
};

const log  = (msg = '') => console.log(msg);
const ok   = (msg) => console.log(`${C.green}${msg}${C.reset}`);
const info = (msg) => console.log(`${C.cyan}${msg}${C.reset}`);
const warn = (msg) => console.log(`${C.yellow}${msg}${C.reset}`);
const fail = (msg) => console.log(`${C.red}${msg}${C.reset}`);

// ─── 1. Detectar plataforma ───────────────────────────────────────────────────
//
//  'windows' → Node.js corriendo en Windows (PowerShell / CMD)
//  'wsl'     → Node.js corriendo dentro de WSL (Linux sobre Windows)
//  'mac'     → macOS nativo
//  'linux'   → Linux nativo (no WSL)

function detectPlatform() {
  if (process.platform === 'win32') return 'windows';
  if (process.platform === 'darwin') return 'mac';
  try {
    const v = readFileSync('/proc/version', 'utf8').toLowerCase();
    if (v.includes('microsoft') || v.includes('wsl')) return 'wsl';
  } catch { /* /proc/version no existe fuera de Linux */ }
  return 'linux';
}

const platform = detectPlatform();

info('\n=== DEV-START: entorno de desarrollo ===\n');
const modoStr = platform === 'windows'
  ? 'WINDOWS (prioridad: Docker Desktop nativo → WSL fallback)'
  : platform.toUpperCase();
info(`[ 1 / 6 ] Plataforma detectada: ${modoStr}\n`);

// ─── 2. Localizar Docker ──────────────────────────────────────────────────────
//
//  Prioridad en Windows:
//    1º Docker Desktop nativo  → todo corre en Windows, sin tocar WSL
//    2º Docker en WSL          → fallback, solo si Docker Desktop no responde
//
//  En macOS / Linux / WSL: Docker siempre es local.

let dockerPrefix = '';   // '' → nativo | 'wsl' | 'wsl -d archlinux'
let wslTargetDir = '';   // ruta al proyecto dentro de WSL (solo windows+WSL fallback)

info('[ 2 / 6 ] Localizando Docker...');

if (platform === 'windows') {

  // ── PRIORIDAD 1: Docker Desktop nativo en Windows ──────────────────────────
  // Esta es la ruta principal. Todos los comandos (docker, npm, sequelize)
  // corren directamente en Windows sin involucrar WSL.
  let nativeOk = false;
  try {
    execSync('docker info', { stdio: 'ignore' });
    nativeOk = true;
  } catch { /* Docker Desktop no está corriendo o no está instalado */ }

  if (nativeOk) {
    ok('  [WINDOWS NATIVO] Docker Desktop detectado. Usando Windows como entorno principal.\n');

  } else {
    // ── PRIORIDAD 2 (fallback): Docker dentro de WSL ────────────────────────
    // Solo se usa si Docker Desktop no responde en Windows.
    warn('  Docker Desktop no responde en Windows.');
    warn('  Recomendación: iniciá Docker Desktop para evitar este fallback.\n');
    warn('  Buscando Docker dentro de WSL como alternativa...');

    let found = false;
    for (const distro of ['wsl', 'wsl -d archlinux']) {
      try {
        execSync(`${distro} docker info`, { stdio: 'ignore' });
        dockerPrefix = distro;
        warn(`  [FALLBACK WSL] Docker encontrado en: ${distro}`);
        warn('  Para volver al modo Windows nativo, iniciá Docker Desktop.\n');
        found = true;
        break;
      } catch { /* probar siguiente distro */ }
    }

    if (!found) {
      fail('  No se encontró Docker en Windows ni en WSL.');
      fail('  Opciones:');
      fail('    • Iniciá Docker Desktop (recomendado para Windows).');
      fail('    • O iniciá el daemon dentro de WSL: wsl sudo service docker start\n');
      process.exit(1);
    }

    // Convertir ruta Windows → ruta WSL para los comandos del fallback
    try {
      const escaped = targetDir.replace(/\\/g, '/');
      wslTargetDir = execSync(`${dockerPrefix} wslpath "${escaped}"`).toString().trim();
    } catch {
      // Conversión manual: C:\foo\bar → /mnt/c/foo/bar
      wslTargetDir = targetDir
        .replace(/^([A-Za-z]):/, (_, l) => `/mnt/${l.toLowerCase()}`)
        .replace(/\\/g, '/');
    }
    info(`  Ruta del proyecto en WSL: ${wslTargetDir}\n`);
  }

} else {
  // macOS, Linux nativo o WSL: Docker siempre es local
  try {
    execSync('docker info', { stdio: 'ignore' });
    ok(`  Docker disponible localmente en ${platform}.\n`);
  } catch {
    fail(`  Docker no está disponible en ${platform}.`);
    if (platform === 'mac')   fail('  Iniciá Docker Desktop e intentá de nuevo.');
    if (platform === 'linux') fail('  Iniciá el daemon: sudo systemctl start docker');
    if (platform === 'wsl')   fail('  Iniciá el daemon en WSL: sudo service docker start');
    log();
    process.exit(1);
  }
}

// ─── Helpers de ejecución ─────────────────────────────────────────────────────
//
//  run()       → ejecuta un comando en el entorno correcto (hereda stdio)
//  runOutput() → igual pero devuelve la salida como string

const run = (cmd, opts = {}) => {
  if (dockerPrefix) {
    // Windows + Docker en WSL: ejecutar dentro de WSL
    execSync(`${dockerPrefix} bash -c "cd '${wslTargetDir}' && ${cmd}"`, opts);
  } else {
    // Cualquier otra plataforma: ejecutar localmente
    execSync(cmd, { cwd: targetDir, ...opts });
  }
};

const runOutput = (cmd) => {
  if (dockerPrefix) {
    return execSync(`${dockerPrefix} bash -c "cd '${wslTargetDir}' && ${cmd}"`).toString().trim();
  }
  return execSync(cmd, { cwd: targetDir }).toString().trim();
};

const sleep2s = () =>
  execSync('node -e "Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000)"');

// ─── 3. Levantar base de datos ────────────────────────────────────────────────

info('[ 3 / 6 ] Levantando contenedor de base de datos...');

// Si el contenedor ya está healthy no hace falta levantarlo de nuevo
let alreadyHealthy = false;
try {
  const dbId = runOutput('docker compose ps -q db');
  if (dbId) {
    const status = runOutput(`docker inspect -f "{{.State.Health.Status}}" ${dbId}`);
    if (status === 'healthy') {
      alreadyHealthy = true;
      ok('  Contenedor ya estaba corriendo y saludable.\n');
    }
  }
} catch { /* no existía todavía */ }

if (!alreadyHealthy) {
  // Si el puerto está ocupado por PostgreSQL local en WSL/Linux, lo detiene
  if (platform === 'wsl' || platform === 'linux') {
    try {
      execSync('ss -tlnp 2>/dev/null | grep -q ":5432 "');
      warn('  Puerto 5432 ocupado — deteniendo servicio PostgreSQL local...');
      execSync(
        'sudo service postgresql stop 2>/dev/null || sudo systemctl stop postgresql 2>/dev/null || true',
        { stdio: 'ignore' }
      );
      ok('  Servicio local detenido.\n');
    } catch { /* puerto libre o no se pudo verificar */ }
  }

  try {
    run('docker compose up -d db', { stdio: 'inherit' });
  } catch (e) {
    fail(`\n  Error al iniciar el contenedor: ${e.message}`);
    fail(`  Verificá qué ocupa el puerto 5432: ss -tlnp | grep 5432\n`);
    process.exit(1);
  }
}

// ─── 4. Esperar healthcheck ───────────────────────────────────────────────────

info('\n[ 4 / 6 ] Esperando que la base de datos esté lista...');
let healthy = false;
let retries  = 20;

while (!healthy && retries > 0) {
  try {
    const dbId   = runOutput('docker compose ps -q db');
    const status = runOutput(`docker inspect -f "{{.State.Health.Status}}" ${dbId}`);
    if (status === 'healthy') {
      healthy = true;
      ok('  Base de datos lista (healthy).\n');
    } else {
      warn(`  Estado: ${status} — reintentando en 2 s... (${retries} intentos restantes)`);
      retries--;
      sleep2s();
    }
  } catch {
    retries--;
    sleep2s();
  }
}

if (!healthy) {
  fail('  La base de datos no quedó saludable a tiempo.');
  fail('  Revisá los logs: docker compose -f app/docker-compose.yml logs db\n');
  process.exit(1);
}

// ─── 5. Instalar dependencias ─────────────────────────────────────────────────

info('[ 5 / 6 ] Instalando dependencias Node.js...');
try {
  run('npm install', { stdio: 'inherit' });
  ok('  Dependencias instaladas.\n');
} catch (e) {
  fail(`  Error en npm install: ${e.message}`);
  process.exit(1);
}

// ─── 6. Arrancar Node.js con hot-reload ──────────────────────────────────────

log(`${C.bold}${C.cyan}
══════════════════════════════════════════════════════════
  Entorno listo — iniciando servidor en modo desarrollo
  Plataforma: ${platform.toUpperCase()}${dockerPrefix ? ` (Docker en WSL: ${dockerPrefix})` : ''}
══════════════════════════════════════════════════════════${C.reset}

${C.green}  → Servidor Express:   http://localhost:3000${C.reset}
${C.green}  → Panel AdminJS:      http://localhost:3000/admin${C.reset}
${C.cyan}  → Credenciales:       admin@bar.example  /  admin123${C.reset}

${C.yellow}  Comandos útiles (desde app/):${C.reset}
    Migrar DB:    npx sequelize-cli db:migrate
    Cargar datos: npx sequelize-cli db:seed:all
    Detener DB:   docker compose stop db
    Logs DB:      docker compose logs db

${C.bold}${C.cyan}══════════════════════════════════════════════════════════${C.reset}
`);

info('[ 6 / 6 ] Iniciando Node.js (--watch)...\n');

const nodeProc = spawn('node', ['--watch', 'src/app.js'], {
  cwd: targetDir,
  stdio: 'inherit',
});

nodeProc.on('error', (err) => {
  fail(`  Error al iniciar Node: ${err.message}`);
  process.exit(1);
});

nodeProc.on('exit', (code) => {
  process.exit(code ?? 0);
});
