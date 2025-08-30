import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonAvatar,
  IonToggle,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonChip,
  ToastController,
  LoadingController,
  AlertController,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline,
  trophyOutline,
  settingsOutline,
  statsChartOutline,
  warningOutline,
  createOutline,
  chevronForwardOutline,
  calendarOutline,
  resizeOutline,
  scaleOutline,
  flameOutline,
  fitnessOutline,
  trendingUpOutline,
  notificationsOutline,
  moonOutline,
  lockClosedOutline,
  analyticsOutline,
  downloadOutline,
  trashOutline,
  cameraOutline,
  logOutOutline,
  chevronDownCircleOutline, alertCircleOutline, flaskOutline } from 'ionicons/icons';
import { AuthService } from '../shared/services/auth.service';
import { ApiService } from '../shared/services/api.service';
import { User, UserAllergy, UserAdditiveSensitivity } from '../shared/interfaces/types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonAvatar,
    IonToggle,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonBadge,
    IonChip
  ]
})
export class ProfilePage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);

  user: User | null = null;
  isLoading = false;
  private subscriptions: Subscription[] = [];

  constructor() {
    addIcons({logOutOutline,cameraOutline,personOutline,createOutline,chevronForwardOutline,calendarOutline,resizeOutline,scaleOutline,warningOutline,alertCircleOutline,flaskOutline,trophyOutline,flameOutline,fitnessOutline,trendingUpOutline,settingsOutline,notificationsOutline,moonOutline,lockClosedOutline,statsChartOutline,analyticsOutline,downloadOutline,trashOutline,chevronDownCircleOutline});
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Carica il profilo utente
   */
  async loadUserProfile(event?: any) {
    if (!event) {
      this.isLoading = true;
    }

    try {
      // TODO: Implementare chiamata API reale
      // const userProfile = await this.apiService.getUserProfile().toPromise();
      
      // Mock data per ora
      this.user = {
        id: 1,
        name: 'Mario Rossi',
        email: 'mario.rossi@email.com',
        birth_date: '1990-05-15',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'male',
        height: 175,
        weight: 70,
        avatar: null,
        nutritionGoals: {
          daily_calories: 2000,
          dailyCalories: 2000,
          daily_proteins: 150,
          daily_carbs: 250,
          daily_fats: 67,
          goal_type: 'maintain',
          goal: 'maintain', 
          activityLevel: 'moderate'
        },
        preferences: {
          notifications: true,
          darkMode: false,
          units: 'metric'
        },
        allergies: [
          {
            allergen_code: 'nuts',
            allergen_name: 'Frutta a guscio',
            severity: 'severe'
          },
          {
            allergen_code: 'lactose',
            allergen_name: 'Lattosio',
            severity: 'moderate'
          }
        ],
        additives_sensitivity: [
          {
            additive_code: 'E621',
            additive_name: 'Glutammato monosodico',
            sensitivity_level: 'medium'
          }
        ],
        totalMeals: 145,
        currentStreak: 7,
        joinDate: new Date('2024-01-15'),
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      if (event) {
        event.target.complete();
      }
    } catch (error) {
      console.error('Errore caricamento profilo:', error);
      await this.showToast('Errore nel caricamento del profilo', 'danger');
      
      if (event) {
        event.target.complete();
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Calcola età dell'utente
   */
  getAge(): number {
    if (!this.user?.dateOfBirth) return 0;
    
    const today = new Date();
    const birthDate = new Date(this.user.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Calcola giorni attivi
   */
  getDaysActive(): number {
    if (!this.user?.joinDate) return 0;
    
    const today = new Date();
    const joinDate = new Date(this.user.joinDate);
    const timeDiff = today.getTime() - joinDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff;
  }

  /**
   * Ottieni label obiettivo
   */
  getGoalLabel(): string {
    const goal = this.user?.nutritionGoals?.goal || this.user?.nutritionGoals?.goal_type;
    if (!goal) return '--';
    
    const goalLabels: { [key: string]: string } = {
      'lose': 'Perdere peso',
      'gain': 'Aumentare peso',
      'maintain': 'Mantenere peso'
    };
    
    return goalLabels[goal] || '--';
  }

  /**
   * Ottieni label livello attività
   */
  getActivityLevelLabel(): string {
    const activityLevel = this.user?.nutritionGoals?.activityLevel || this.user?.activity_level;
    if (!activityLevel) return '--';
    
    const activityLabels: { [key: string]: string } = {
      'sedentary': 'Sedentario',
      'light': 'Leggero',
      'moderate': 'Moderato',
      'active': 'Attivo',
      'very_active': 'Molto attivo'
    };
    
    return activityLabels[activityLevel] || '--';
  }

  /**
   * Visualizza obiettivi nutrizionali
   */
  async viewGoals() {
    this.router.navigate(['/profile/view-goals']);
  }

  /**
   * Modifica dati personali
   */
  async editPersonalData() {
    // TODO: Navigare a pagina modifica dati personali
    this.router.navigate(['/profile/edit-personal']);
  }

  /**
   * Modifica allergeni e additivi
   */
  async editAllergensAndAdditives() {
    // TODO: Navigare a pagina modifica allergeni e additivi
    this.router.navigate(['/profile/edit-allergies']);
  }

  /**
   * Conta totale allergeni e sensibilità
   */
  getTotalAllergensCount(): number {
    const allergiesCount = this.user?.allergies?.length || 0;
    const additivesCount = this.user?.additives_sensitivity?.length || 0;
    return allergiesCount + additivesCount;
  }

  /**
   * Helper methods per allergeni e additivi
   */
  getAllergiesCount(): number {
    return this.user?.allergies?.length || 0;
  }

  getAdditivesCount(): number {
    return this.user?.additives_sensitivity?.length || 0;
  }

  getAllergiesPreview(): UserAllergy[] {
    return this.user?.allergies?.slice(0, 3) || [];
  }

  getAdditivesPreview(): UserAdditiveSensitivity[] {
    return this.user?.additives_sensitivity?.slice(0, 3) || [];
  }

  hasMoreAllergies(): boolean {
    return (this.user?.allergies?.length || 0) > 3;
  }

  hasMoreAdditives(): boolean {
    return (this.user?.additives_sensitivity?.length || 0) > 3;
  }

  hasAllergies(): boolean {
    return (this.user?.allergies?.length || 0) > 0;
  }

  hasAdditives(): boolean {
    return (this.user?.additives_sensitivity?.length || 0) > 0;
  }

  /**
   * Colore severity allergeni
   */
  getAllergySeverityColor(severity: string): string {
    switch (severity) {
      case 'severe': return 'danger';
      case 'moderate': return 'warning';
      case 'mild': return 'medium';
      default: return 'medium';
    }
  }

  /**
   * Colore sensibilità additivi
   */
  getAdditiveSensitivityColor(sensitivity: string): string {
    switch (sensitivity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'medium';
      default: return 'medium';
    }
  }

  /**
   * Modifica obiettivi nutrizionali
   */
  async editNutritionGoals() {
    // TODO: Navigare a pagina modifica obiettivi
    this.router.navigate(['/profile/edit-goals']);
  }

  /**
   * Cambia avatar
   */
  async changeAvatar() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Cambia Avatar',
      buttons: [
        {
          text: 'Scatta foto',
          icon: 'camera-outline',
          handler: () => {
            this.takePhoto();
          }
        },
        {
          text: 'Scegli dalla galleria',
          icon: 'images-outline',
          handler: () => {
            this.selectFromGallery();
          }
        },
        {
          text: 'Rimuovi avatar',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.removeAvatar();
          }
        },
        {
          text: 'Annulla',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  /**
   * Scatta foto per avatar
   */
  async takePhoto() {
    // TODO: Implementare capture camera con Capacitor
    await this.showToast('Funzionalità camera in sviluppo', 'warning');
  }

  /**
   * Seleziona foto dalla galleria
   */
  async selectFromGallery() {
    // TODO: Implementare selezione da galleria con Capacitor
    await this.showToast('Funzionalità galleria in sviluppo', 'warning');
  }

  /**
   * Rimuovi avatar
   */
  async removeAvatar() {
    if (this.user) {
      this.user.avatar = null;
      // TODO: Salvare su backend
      await this.showToast('Avatar rimosso', 'success');
    }
  }

  /**
   * Toggle notifiche
   */
  async toggleNotifications(event: any) {
    if (this.user?.preferences) {
      this.user.preferences.notifications = event.detail.checked;
      // TODO: Salvare preferenze su backend
      await this.showToast(
        event.detail.checked ? 'Notifiche attivate' : 'Notifiche disattivate', 
        'success'
      );
    }
  }

  /**
   * Toggle tema scuro
   */
  async toggleDarkMode(event: any) {
    if (this.user?.preferences) {
      this.user.preferences.darkMode = event.detail.checked;
      // TODO: Applicare tema scuro e salvare preferenze
      await this.showToast(
        event.detail.checked ? 'Tema scuro attivato' : 'Tema chiaro attivato', 
        'success'
      );
    }
  }

  /**
   * Cambia password
   */
  async changePassword() {
    this.router.navigate(['/profile/change-password']);
  }

  /**
   * Visualizza statistiche dettagliate
   */
  async viewDetailedStats() {
    // TODO: Navigare a pagina statistiche
    this.router.navigate(['/profile/stats']);
  }

  /**
   * Esporta dati
   */
  async exportData() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Esporta Dati',
      buttons: [
        {
          text: 'Esporta in CSV',
          icon: 'document-text-outline',
          handler: () => {
            this.exportToCSV();
          }
        },
        {
          text: 'Esporta in PDF',
          icon: 'document-outline',
          handler: () => {
            this.exportToPDF();
          }
        },
        {
          text: 'Annulla',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  /**
   * Esporta in CSV
   */
  async exportToCSV() {
    // TODO: Implementare export CSV
    await this.showToast('Export CSV in sviluppo', 'warning');
  }

  /**
   * Esporta in PDF
   */
  async exportToPDF() {
    // TODO: Implementare export PDF
    await this.showToast('Export PDF in sviluppo', 'warning');
  }

  /**
   * Elimina account
   */
  async deleteAccount() {
    const alert = await this.alertController.create({
      header: 'Elimina Account',
      message: 'Sei sicuro di voler eliminare il tuo account? Questa azione non può essere annullata e perderai tutti i tuoi dati.',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: () => {
            this.confirmDeleteAccount();
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Conferma eliminazione account
   */
  async confirmDeleteAccount() {
    const loading = await this.loadingController.create({
      message: 'Eliminazione account...'
    });
    await loading.present();

    try {
      // TODO: Implementare eliminazione account
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      
      await loading.dismiss();
      await this.showToast('Account eliminato con successo', 'success');
      
      // Logout e redirect
      await this.authService.logout();
      this.router.navigate(['/login']);
      
    } catch (error) {
      await loading.dismiss();
      console.error('Errore eliminazione account:', error);
      await this.showToast('Errore nell\'eliminazione dell\'account', 'danger');
    }
  }

  /**
   * Logout
   */
  async onLogout() {
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Sei sicuro di voler uscire?',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Esci',
          handler: async () => {
            await this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Mostra toast
   */
  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
