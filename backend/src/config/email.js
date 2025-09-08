const nodemailer = require('nodemailer');
const config = require('./environment');

class EmailConfig {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.emailLimits = new Map(); // Mappa per tracciare i limiti delle email
  }

  // Inizializza configurazione email
  async initialize() {
    try {
      if (!config.email.smtp.auth.user || !config.email.smtp.auth.pass) {
        console.warn('⚠️ Configurazione email non completa');
        return false;
      }

      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass,
        }
      });

      // Test configurazione
      await this.transporter.verify();
      this.isConfigured = true;
      console.log('✅ Configurazione email inizializzata');
      return true;
    } catch (error) {
      console.error('❌ Errore inizializzazione email:', error.message);
      this.isConfigured = false;
      return false;
    }
  }

  // Invia email con password temporanea
  async sendTemporaryPasswordEmail(email, tempPassword, userName) {
    if (!this.isConfigured) {
      throw new Error('Email non configurata');
    }

    if (!this.checkEmailLimit(email)) {
      throw new Error('Limite email raggiunto. Riprova più tardi.');
    }
    
    try {
      return await this.transporter.sendMail({
        from: {
          name: 'NutriJournal',
          address: config.email.smtp.auth.user
        },
        to: email,
        subject: 'Password Temporanea - NutriJournal',
        text: `Ciao ${userName || 'Utente'},\n\n` +
              `Ecco la tua password temporanea: ${tempPassword}\n\n` +
              `Accedi con questa password e cambiala immediatamente.\n\n` +
              `Cordiali saluti,\nIl team di NutriJournal`
      });
    } catch (error) {
      throw new Error(`Errore invio email password temporanea: ${error.message}`);
    }
  }

  // Invia email di benvenuto
  async sendWelcomeEmail(email, userName) {
    if (!this.isConfigured) {
      return false;
    }

    try {
      return await this.transporter.sendMail({
        from: {
          name: 'NutriJournal',
          address: config.email.smtp.auth.user
        },
        to: email,
        subject: 'Benvenuto in NutriJournal',
        text: `Ciao ${userName || 'Utente'},\n\n` +
              `Benvenuto in NutriJournal! Siamo felici di averti con noi.\n\n` +
              `Con NutriJournal potrai:\n` +
              `- Tracciare i tuoi pasti giornalieri\n` +
              `- Monitorare le tue calorie\n` +
              `- Analizzare i tuoi progressi\n\n` +
              `Per iniziare, accedi all'app e completa il tuo profilo.\n\n` +
              `Buon viaggio nutrizionale!\n` +
              `Il team di NutriJournal`
      });
    } catch (error) {
      console.error('Errore invio email benvenuto:', error.message);
      return false;
    }
  }

  // Controlla limiti invio email
  checkEmailLimit(email) {
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;
    const limit = 5; // massimo 5 email all'ora per utente
    
    if (!this.emailLimits.has(email)) {
      this.emailLimits.set(email, {
        count: 1,
        firstAttempt: now
      });
      return true;
    }

    const userLimit = this.emailLimits.get(email);
    if (now - userLimit.firstAttempt > hourInMs) {
      // Reset se è passata un'ora
      this.emailLimits.set(email, {
        count: 1,
        firstAttempt: now
      });
      return true;
    }

    if (userLimit.count >= limit) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  // Test configurazione email
  async testEmailConfig() {
    if (!this.isConfigured) {
      return { success: false, message: 'Email non configurata' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Configurazione email valida' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  get isEmailConfigured() {
    return this.isConfigured;
  }
}

module.exports = new EmailConfig();
