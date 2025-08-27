/**
 * Utility per gestione date e timezone
 */

class DateUtils {
  /**
   * Ottieni data corrente in formato YYYY-MM-DD per timezone specificato
   */
  static getCurrentDate(timezone = 'Europe/Rome') {
    const now = new Date();
    const options = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    return formatter.format(now);
  }

  /**
   * Ottieni ora corrente in formato HH:MM:SS per timezone specificato
   */
  static getCurrentTime(timezone = 'Europe/Rome') {
    const now = new Date();
    const options = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    
    const formatter = new Intl.DateTimeFormat('it-IT', options);
    return formatter.format(now);
  }

  /**
   * Converte data in timestamp italiano
   */
  static toItalianTimestamp(date = new Date()) {
    return new Date(date).toLocaleString('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Valida formato data YYYY-MM-DD
   */
  static isValidDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    const [year, month, day] = dateString.split('-').map(Number);
    
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
  }

  /**
   * Valida formato ora HH:MM:SS
   */
  static isValidTime(timeString) {
    if (!/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      return false;
    }

    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    
    return hours >= 0 && hours <= 23 &&
           minutes >= 0 && minutes <= 59 &&
           seconds >= 0 && seconds <= 59;
  }

  /**
   * Ottieni inizio settimana (lunedì) per data specificata
   */
  static getWeekStart(dateString) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Domenica = 0
    
    const monday = new Date(date);
    monday.setDate(date.getDate() - daysToMonday);
    
    return this.formatDate(monday);
  }

  /**
   * Ottieni fine settimana (domenica) per data specificata
   */
  static getWeekEnd(dateString) {
    const weekStart = new Date(this.getWeekStart(dateString));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return this.formatDate(weekEnd);
  }

  /**
   * Ottieni inizio mese per data specificata
   */
  static getMonthStart(dateString) {
    const date = new Date(dateString);
    return this.formatDate(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  /**
   * Ottieni fine mese per data specificata
   */
  static getMonthEnd(dateString) {
    const date = new Date(dateString);
    return this.formatDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  }

  /**
   * Formatta Date object in YYYY-MM-DD
   */
  static formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formatta Date object in HH:MM:SS
   */
  static formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Aggiungi giorni a una data
   */
  static addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return this.formatDate(date);
  }

  /**
   * Sottrai giorni da una data
   */
  static subtractDays(dateString, days) {
    return this.addDays(dateString, -days);
  }

  /**
   * Calcola differenza in giorni tra due date
   */
  static daysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Ottieni array di date tra due date
   */
  static getDateRange(startDate, endDate) {
    const dates = [];
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      dates.push(currentDate);
      currentDate = this.addDays(currentDate, 1);
    }
    
    return dates;
  }

  /**
   * Verifica se una data è oggi
   */
  static isToday(dateString, timezone = 'Europe/Rome') {
    return dateString === this.getCurrentDate(timezone);
  }

  /**
   * Verifica se una data è ieri
   */
  static isYesterday(dateString, timezone = 'Europe/Rome') {
    const yesterday = this.subtractDays(this.getCurrentDate(timezone), 1);
    return dateString === yesterday;
  }

  /**
   * Verifica se una data è in questa settimana
   */
  static isThisWeek(dateString, timezone = 'Europe/Rome') {
    const today = this.getCurrentDate(timezone);
    const weekStart = this.getWeekStart(today);
    const weekEnd = this.getWeekEnd(today);
    
    return dateString >= weekStart && dateString <= weekEnd;
  }

  /**
   * Verifica se una data è in questo mese
   */
  static isThisMonth(dateString, timezone = 'Europe/Rome') {
    const today = this.getCurrentDate(timezone);
    const monthStart = this.getMonthStart(today);
    const monthEnd = this.getMonthEnd(today);
    
    return dateString >= monthStart && dateString <= monthEnd;
  }

  /**
   * Ottieni nome giorno della settimana in italiano
   */
  static getDayName(dateString) {
    const date = new Date(dateString);
    const dayNames = [
      'Domenica', 'Lunedì', 'Martedì', 'Mercoledì',
      'Giovedì', 'Venerdì', 'Sabato'
    ];
    return dayNames[date.getDay()];
  }

  /**
   * Ottieni nome mese in italiano
   */
  static getMonthName(dateString) {
    const date = new Date(dateString);
    const monthNames = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
      'Maggio', 'Giugno', 'Luglio', 'Agosto',
      'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return monthNames[date.getMonth()];
  }

  /**
   * Formatta data in italiano (es: "Lunedì 15 Gennaio 2024")
   */
  static formatItalianDate(dateString) {
    const date = new Date(dateString);
    const dayName = this.getDayName(dateString);
    const day = date.getDate();
    const monthName = this.getMonthName(dateString);
    const year = date.getFullYear();
    
    return `${dayName} ${day} ${monthName} ${year}`;
  }

  /**
   * Calcola età da data di nascita
   */
  static calculateAge(birthDate, referenceDate = null) {
    const birth = new Date(birthDate);
    const reference = referenceDate ? new Date(referenceDate) : new Date();
    
    let age = reference.getFullYear() - birth.getFullYear();
    const monthDiff = reference.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Ottieni timestamp Unix
   */
  static getUnixTimestamp(date = new Date()) {
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * Converti Unix timestamp in Date
   */
  static fromUnixTimestamp(timestamp) {
    return new Date(timestamp * 1000);
  }

  /**
   * Ottieni periodo relativo (es: "2 giorni fa", "tra 1 settimana")
   */
  static getRelativePeriod(dateString, timezone = 'Europe/Rome') {
    const today = this.getCurrentDate(timezone);
    const daysDiff = this.daysDifference(today, dateString);
    
    if (daysDiff === 0) return 'Oggi';
    if (daysDiff === 1) return 'Domani';
    if (daysDiff === -1) return 'Ieri';
    
    if (daysDiff > 0) {
      if (daysDiff <= 7) return `Tra ${daysDiff} giorni`;
      if (daysDiff <= 30) return `Tra ${Math.ceil(daysDiff / 7)} settimane`;
      return `Tra ${Math.ceil(daysDiff / 30)} mesi`;
    } else {
      const absDiff = Math.abs(daysDiff);
      if (absDiff <= 7) return `${absDiff} giorni fa`;
      if (absDiff <= 30) return `${Math.ceil(absDiff / 7)} settimane fa`;
      return `${Math.ceil(absDiff / 30)} mesi fa`;
    }
  }

  /**
   * Genera range di date per report
   */
  static generateReportDates(type, referenceDate = null) {
    const reference = referenceDate || this.getCurrentDate();
    
    switch (type) {
      case 'week':
        return {
          start: this.getWeekStart(reference),
          end: this.getWeekEnd(reference),
          label: 'Questa settimana',
        };
      
      case 'month':
        return {
          start: this.getMonthStart(reference),
          end: this.getMonthEnd(reference),
          label: 'Questo mese',
        };
      
      case 'last_7_days':
        return {
          start: this.subtractDays(reference, 6),
          end: reference,
          label: 'Ultimi 7 giorni',
        };
      
      case 'last_30_days':
        return {
          start: this.subtractDays(reference, 29),
          end: reference,
          label: 'Ultimi 30 giorni',
        };
      
      default:
        return {
          start: reference,
          end: reference,
          label: 'Oggi',
        };
    }
  }
}

module.exports = DateUtils;
