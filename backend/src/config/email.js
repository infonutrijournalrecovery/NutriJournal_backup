const nodemailer = require('nodemailer');
const config = require('./environment');

class EmailConfig {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
  }

  // Inizializza configurazione email
  async initialize() {
    try {
      if (!config.email.smtp.auth.user || !config.email.smtp.auth.pass) {
        console.warn('⚠️ Configurazione email non completa. Reset password disabilitato.');
        return false;
      }

      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Test configurazione
      await this.transporter.verify();
      this.isConfigured = true;
      console.log('✅ Configurazione email inizializzata correttamente');
      return true;
    } catch (error) {
      console.error('❌ Errore inizializzazione email:', error.message);
      this.isConfigured = false;
      return false;
    }
  }

  // Invia email di reset password
  async sendPasswordResetEmail(email, resetToken, userName) {
    if (!this.isConfigured) {
      throw new Error('Servizio email non configurato');
    }

    const resetUrl = `${config.cors.origin[0]}/auth/reset/${resetToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Password - NutriJournal</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍎 NutriJournal</h1>
          </div>
          <div class="content">
            <h2>Ciao ${userName || 'Utente'},</h2>
            <p>Hai richiesto il reset della password per il tuo account NutriJournal.</p>
            <p>Clicca sul pulsante qui sotto per impostare una nuova password:</p>
            
            <a href="${resetUrl}" class="button">Reimposta Password</a>
            
            <p><strong>Importante:</strong></p>
            <ul>
              <li>Questo link è valido per 1 ora</li>
              <li>Se non hai richiesto il reset, ignora questa email</li>
              <li>Il link può essere utilizzato una sola volta</li>
            </ul>
            
            <p>Se il pulsante non funziona, copia e incolla questo link nel browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>© 2025 NutriJournal - Tracciamento Nutrizionale Italiano</p>
            <p>Questa email è stata inviata automaticamente, non rispondere.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Ciao ${userName || 'Utente'},

Hai richiesto il reset della password per il tuo account NutriJournal.

Clicca su questo link per impostare una nuova password:
${resetUrl}

IMPORTANTE:
- Questo link è valido per 1 ora
- Se non hai richiesto il reset, ignora questa email
- Il link può essere utilizzato una sola volta

© 2025 NutriJournal - Tracciamento Nutrizionale Italiano
    `;

    const mailOptions = {
      from: {
        name: config.email.from.name,
        address: config.email.from.email,
      },
      to: email,
      subject: '🔐 Reset Password - NutriJournal',
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email reset password inviata a: ${email}`);
      return result;
    } catch (error) {
      console.error('❌ Errore invio email:', error);
      throw new Error('Impossibile inviare email di reset');
    }
  }

  // Invia email di benvenuto
  async sendWelcomeEmail(email, userName) {
    if (!this.isConfigured) {
      return false; // Non bloccante se email non configurata
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Benvenuto in NutriJournal</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
          .feature { padding: 10px; margin: 10px 0; background: white; border-left: 4px solid #4CAF50; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍎 Benvenuto in NutriJournal!</h1>
          </div>
          <div class="content">
            <h2>Ciao ${userName}!</h2>
            <p>Benvenuto nella community di NutriJournal, l'app italiana per il tracciamento nutrizionale.</p>
            
            <h3>🎯 Cosa puoi fare con NutriJournal:</h3>
            <div class="feature">📊 Traccia i tuoi pasti e nutrienti giornalieri</div>
            <div class="feature">🥗 Cerca prodotti nel database italiano</div>
            <div class="feature">🏃 Monitora le attività fisiche</div>
            <div class="feature">📈 Visualizza report e analisi dettagliate</div>
            <div class="feature">🔒 I tuoi dati rimangono sempre privati sul tuo dispositivo</div>
            
            <p>Inizia subito il tuo percorso verso un'alimentazione più consapevole!</p>
          </div>
          <div class="footer">
            <p>© 2025 NutriJournal - Tracciamento Nutrizionale Italiano</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: {
        name: config.email.from.name,
        address: config.email.from.email,
      },
      to: email,
      subject: '🍎 Benvenuto in NutriJournal!',
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email benvenuto inviata a: ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Errore invio email benvenuto:', error);
      return false;
    }
  }

  // Test configurazione email
  async testEmailConfig() {
    try {
      if (!this.isConfigured) {
        return { success: false, message: 'Email non configurata' };
      }

      await this.transporter.verify();
      return { success: true, message: 'Configurazione email valida' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Getter per verificare se email è configurata
  get isEmailConfigured() {
    return this.isConfigured;
  }
}

module.exports = new EmailConfig();
