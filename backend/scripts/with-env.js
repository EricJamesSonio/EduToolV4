#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

const TARGETS = {
  local: { file: '.env.local', label: 'LOCAL' },
  prod: { file: '.env', label: 'PRODUCTION' },
};

const KNOWN_FLAGS = new Set(['--no-confirm', '--yes', '--prisma']);

function fail(message) {
  console.error('\n[env-runner] ' + message + '\n');
  process.exit(1);
}

function parseArgs(argv) {
  const target = argv[0];
  const rest = argv.slice(1);
  const sep = rest.indexOf('--');

  if (!TARGETS[target] || sep === -1 || sep === rest.length - 1) {
    fail(
      'Usage: node scripts/with-env.js <local|prod> [--no-confirm] [--yes] [--prisma] -- <command...>',
    );
  }

  const flags = new Set(rest.slice(0, sep));
  for (const flag of flags) {
    if (!KNOWN_FLAGS.has(flag)) {
      fail('Unknown flag: ' + flag);
    }
  }

  return { target, flags, command: rest.slice(sep + 1) };
}

function loadEnv(target) {
  const file = TARGETS[target].file;
  const envPath = path.join(process.cwd(), file);

  if (!fs.existsSync(envPath)) {
    fail('Missing ' + file + ' in ' + process.cwd() + '. Create it first.');
  }

  let dotenv;
  let dotenvExpand;
  try {
    dotenv = require('dotenv');
    dotenvExpand = require('dotenv-expand');
  } catch (e) {
    fail('dotenv / dotenv-expand not found. Run npm install.');
  }

  // override: true so the chosen file always wins over variables that are
  // already present in the shell. The other env file is never loaded.
  const parsed = dotenv.config({ path: envPath, override: true });
  if (parsed.error) {
    fail('Could not read ' + file + ': ' + parsed.error.message);
  }
  dotenvExpand.expand(parsed);

  process.env.APP_TARGET = target;
  process.env.APP_ENV_FILE = file;

  return file;
}

function describeDb(target, file) {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    fail('DATABASE_URL is not set in ' + file + '.');
  }

  let url;
  try {
    url = new URL(raw);
  } catch (e) {
    fail('DATABASE_URL in ' + file + ' is not a valid URL.');
  }

  const isLocal = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(
    url.hostname,
  );

  if (target === 'local' && !isLocal) {
    fail(
      'Target is LOCAL but DATABASE_URL in ' +
        file +
        ' points to a remote host (' +
        url.hostname +
        '). Aborting to protect the remote database.',
    );
  }

  if (target === 'prod' && isLocal) {
    fail(
      'Target is PROD but DATABASE_URL in ' +
        file +
        ' points to ' +
        url.hostname +
        '. Put the Aiven connection string in ' +
        file +
        '.',
    );
  }

  return {
    host: url.hostname,
    port: url.port || '5432',
    name: decodeURIComponent(url.pathname.replace(/^\//, '')),
    user: decodeURIComponent(url.username),
    isLocal,
  };
}

function applyPrismaSsl(db) {
  if (db.isLocal) {
    return;
  }
  if (process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false') {
    return;
  }

  const url = new URL(process.env.DATABASE_URL);
  if (!url.searchParams.has('sslaccept')) {
    url.searchParams.set('sslaccept', 'accept_invalid_certs');
    process.env.DATABASE_URL = url.toString();
  }
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function printBanner(target, file, db, commandText) {
  const label = TARGETS[target].label;
  const line = '='.repeat(64);
  console.log('\n' + line);
  console.log('  TARGET   : ' + label);
  console.log('  ENV FILE : ' + file);
  console.log('  DATABASE : ' + db.user + '@' + db.host + ':' + db.port + '/' + db.name);
  console.log('  COMMAND  : ' + commandText);
  console.log(line + '\n');
}

async function confirmRun(target, db, flags) {
  if (flags.has('--no-confirm')) {
    return;
  }

  if (target === 'local' && flags.has('--yes')) {
    return;
  }

  if (!process.stdin.isTTY) {
    fail('Confirmation required but no interactive terminal is available.');
  }

  if (target === 'prod') {
    const expected = db.name || 'PROD';
    console.log('  WARNING: this runs against the PRODUCTION database.');
    const answer = await ask(
      '  Type the database name "' + expected + '" to continue: ',
    );
    if (answer !== expected) {
      fail('Cancelled. Nothing was run.');
    }
    return;
  }

  const answer = await ask('  Continue on the LOCAL database? (y/N): ');
  if (!/^y(es)?$/i.test(answer)) {
    fail('Cancelled. Nothing was run.');
  }
}

function quote(arg) {
  if (/[\s"]/.test(arg)) {
    return '"' + arg.replace(/"/g, '\\"') + '"';
  }
  return arg;
}

async function main() {
  const { target, flags, command } = parseArgs(process.argv.slice(2));
  const file = loadEnv(target);
  const db = describeDb(target, file);

  if (flags.has('--prisma')) {
    applyPrismaSsl(db);
  }

  const commandText = command.map(quote).join(' ');
  printBanner(target, file, db, commandText);
  await confirmRun(target, db, flags);

  // Keep this process alive on Ctrl+C so the child can shut down cleanly.
  process.on('SIGINT', () => {});
  process.on('SIGTERM', () => {});

  const child = spawn(commandText, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  child.on('exit', (code) => {
    process.exit(code === null ? 1 : code);
  });
}

main().catch((e) => {
  fail(e && e.message ? e.message : String(e));
});