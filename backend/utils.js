#!/usr/bin/env node

/**
 * Script di utilità per la gestione del backend NutriJournal
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKEND_DIR = __dirname;
const DATA_DIR = path.join(BACKEND_DIR, 'data');
const LOGS_DIR = path.join(BACKEND_DIR, 'logs');
const UPLOADS_DIR = path.join(BACKEND_DIR, 'uploads');

/**
 * Utility functions
 */
class NutriJournalUtils {
  
  static showHelp() {
    console.log(`
🍎 NutriJournal Backend Utilities

Comandi disponibili:
  help              Mostra questo messaggio
  status            Controlla stato del server
  start             Avvia il server
  restart           Riavvia il server
  setup             Setup iniziale completo
  clean             Pulisce logs e cache
  backup            Backup del database
  restore <file>    Ripristina database da backup
  test              Esegue i test
  logs              Mostra gli ultimi log
  env-check         Verifica configurazione environment

Esempi:
  node utils.js status
  node utils.js backup
  node utils.js restore backup-2025-08-28.db
    `);
  }

  static checkStatus() {
    console.log('🔍 Controllo stato NutriJournal Backend...\n');
    
    try {
      // Check se il server è in esecuzione
      const response = execSync('curl -s http://localhost:3000/health', { encoding: 'utf8' });
      const health = JSON.parse(response);
      
      console.log('✅ Server: ATTIVO');
      console.log(`📊 Environment: ${health.environment}`);
      console.log(`💾 Database: ${health.database}`);
      console.log(`📧 Email: ${health.email}`);
      console.log(`⏰ Timestamp: ${health.timestamp}`);
    } catch (error) {
      console.log('❌ Server: NON ATTIVO');
      console.log('   Il server non risponde su http://localhost:3000');
    }

    // Check directories
    console.log('\n📁 Controllo directory:');
    const dirs = [DATA_DIR, LOGS_DIR, UPLOADS_DIR];
    dirs.forEach(dir => {
      const exists = fs.existsSync(dir);
      console.log(`   ${exists ? '✅' : '❌'} ${path.basename(dir)}: ${exists ? 'OK' : 'MANCANTE'}`);
    });

    // Check database
    const dbPath = path.join(DATA_DIR, 'nutrijournal.db');
    const dbExists = fs.existsSync(dbPath);
    console.log(`   ${dbExists ? '✅' : '❌'} Database: ${dbExists ? 'OK' : 'MANCANTE'}`);

    // Check .env
    const envPath = path.join(BACKEND_DIR, '.env');
    const envExists = fs.existsSync(envPath);
    console.log(`   ${envExists ? '✅' : '❌'} .env: ${envExists ? 'OK' : 'MANCANTE'}`);
  }

  static startServer() {
    console.log('🚀 Avvio NutriJournal Backend...\n');
    try {
      execSync('node src/server.js', { stdio: 'inherit', cwd: BACKEND_DIR });
    } catch (error) {
      console.error('❌ Errore durante l\'avvio del server');
      process.exit(1);
    }
  }

  static restartServer() {
    console.log('🔄 Riavvio NutriJournal Backend...\n');
    
    try {
      // Prova a fermare il server esistente
      console.log('⏹️ Arresto server esistente...');
      execSync('pkill -f "node.*server.js" || true', { stdio: 'pipe' });
      
      // Aspetta un momento
      console.log('⏳ Attesa 2 secondi...');
      execSync('sleep 2');
      
      // Riavvia
      console.log('🚀 Riavvio server...');
      this.startServer();
    } catch (error) {
      console.error('❌ Errore durante il riavvio');
      process.exit(1);
    }
  }

  static setupComplete() {
    console.log('⚙️ Setup completo NutriJournal Backend...\n');
    
    try {
      // Crea directory necessarie
      console.log('📁 Creazione directory...');
      [DATA_DIR, LOGS_DIR, UPLOADS_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`   ✅ Creata: ${path.basename(dir)}`);
        } else {
          console.log(`   ✅ Esistente: ${path.basename(dir)}`);
        }
      });

      // Setup database
      console.log('\n💾 Inizializzazione database...');
      execSync('node scripts/setup-database.js', { stdio: 'inherit', cwd: BACKEND_DIR });

      // Verifica .env
      console.log('\n🔧 Verifica configurazione...');
      this.checkEnvironment();

      console.log('\n✅ Setup completato con successo!');
      console.log('🚀 Puoi ora avviare il server con: node utils.js start');
      
    } catch (error) {
      console.error('❌ Errore durante il setup:', error.message);
      process.exit(1);
    }
  }

  static cleanLogs() {
    console.log('🧹 Pulizia logs e cache...\n');
    
    try {
      // Pulisci log files
      const logFiles = fs.readdirSync(LOGS_DIR).filter(file => file.endsWith('.log'));
      logFiles.forEach(file => {
        const filePath = path.join(LOGS_DIR, file);
        fs.writeFileSync(filePath, ''); // Svuota il file invece di cancellarlo
        console.log(`   ✅ Pulito: ${file}`);
      });

      // Pulisci cache
      const cacheDir = path.join(BACKEND_DIR, 'cache');
      if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
        fs.mkdirSync(cacheDir, { recursive: true });
        console.log('   ✅ Cache pulita');
      }

      console.log('\n✅ Pulizia completata!');
    } catch (error) {
      console.error('❌ Errore durante la pulizia:', error.message);
    }
  }

  static backupDatabase() {
    console.log('💾 Backup database...\n');
    
    const dbPath = path.join(DATA_DIR, 'nutrijournal.db');
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database non trovato');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const backupPath = path.join(DATA_DIR, `backup-${timestamp}.db`);
    
    try {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`✅ Backup creato: ${path.basename(backupPath)}`);
      console.log(`📍 Percorso: ${backupPath}`);
    } catch (error) {
      console.error('❌ Errore durante il backup:', error.message);
    }
  }

  static restoreDatabase(backupFile) {
    if (!backupFile) {
      console.error('❌ Specifica il file di backup da ripristinare');
      return;
    }

    const backupPath = path.join(DATA_DIR, backupFile);
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ File di backup non trovato: ${backupFile}`);
      return;
    }

    const dbPath = path.join(DATA_DIR, 'nutrijournal.db');
    
    try {
      fs.copyFileSync(backupPath, dbPath);
      console.log(`✅ Database ripristinato da: ${backupFile}`);
    } catch (error) {
      console.error('❌ Errore durante il ripristino:', error.message);
    }
  }

  static runTests() {
    console.log('🧪 Esecuzione test...\n');
    
    try {
      execSync('npm test', { stdio: 'inherit', cwd: BACKEND_DIR });
    } catch (error) {
      console.error('❌ Alcuni test sono falliti');
      process.exit(1);
    }
  }

  static showLogs() {
    console.log('📋 Ultimi log del server:\n');
    
    const logFile = path.join(LOGS_DIR, 'app.log');
    if (!fs.existsSync(logFile)) {
      console.log('❌ File di log non trovato');
      return;
    }

    try {
      execSync(`tail -20 "${logFile}"`, { stdio: 'inherit' });
    } catch (error) {
      // Fallback per Windows
      try {
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n').slice(-20);
        console.log(lines.join('\n'));
      } catch (err) {
        console.error('❌ Impossibile leggere i log');
      }
    }
  }

  static checkEnvironment() {
    console.log('🔧 Verifica configurazione environment...\n');
    
    const envPath = path.join(BACKEND_DIR, '.env');
    if (!fs.existsSync(envPath)) {
      console.error('❌ File .env non trovato');
      return;
    }

    const requiredVars = [
      'JWT_SECRET',
      'DATABASE_PATH',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS'
    ];

    const envContent = fs.readFileSync(envPath, 'utf8');
    const missingVars = [];

    requiredVars.forEach(varName => {
      if (!envContent.includes(`${varName}=`)) {
        missingVars.push(varName);
      } else {
        console.log(`   ✅ ${varName}: Configurato`);
      }
    });

    if (missingVars.length > 0) {
      console.log('\n❌ Variabili mancanti:');
      missingVars.forEach(varName => {
        console.log(`   ❌ ${varName}`);
      });
    } else {
      console.log('\n✅ Tutte le variabili di environment sono configurate');
    }
  }
}

// Parsing argomenti command line
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'help':
  case '-h':
  case '--help':
    NutriJournalUtils.showHelp();
    break;
    
  case 'status':
    NutriJournalUtils.checkStatus();
    break;
    
  case 'start':
    NutriJournalUtils.startServer();
    break;
    
  case 'restart':
    NutriJournalUtils.restartServer();
    break;
    
  case 'setup':
    NutriJournalUtils.setupComplete();
    break;
    
  case 'clean':
    NutriJournalUtils.cleanLogs();
    break;
    
  case 'backup':
    NutriJournalUtils.backupDatabase();
    break;
    
  case 'restore':
    NutriJournalUtils.restoreDatabase(args[1]);
    break;
    
  case 'test':
    NutriJournalUtils.runTests();
    break;
    
  case 'logs':
    NutriJournalUtils.showLogs();
    break;
    
  case 'env-check':
    NutriJournalUtils.checkEnvironment();
    break;
    
  default:
    console.log('❌ Comando non riconosciuto\n');
    NutriJournalUtils.showHelp();
    process.exit(1);
}
