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
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonChip
  ]
})
export class ProfilePage implements OnInit, OnDestroy {
  async takePhoto() {
    await this.showToast('Funzionalità non ancora disponibile', 'warning');
  }

  async selectFromGallery() {
    await this.showToast('Funzionalità non ancora disponibile', 'warning');
  }

  async removeAvatar() {
    await this.showToast('Funzionalità non ancora disponibile', 'warning');
  }
  /**
   * Restituisce una stringa con i nomi degli allergeni separati da virgola
   */
  getAllergyNames(): string {
    if (!this.user?.allergies || this.user.allergies.length === 0) return 'Nessuno';
    return this.user.allergies.map(a => a.allergen_name).join(', ');
  }

  /**
   * Restituisce una stringa con i nomi degli additivi sensibili separati da virgola
   */
  getAdditiveNames(): string {
    if (!this.user?.additives_sensitivity || this.user.additives_sensitivity.length === 0) return 'Nessuno';
    return this.user.additives_sensitivity.map(a => a.additive_name).join(', ');
  }
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
    if (this.user?.created_at) {
      const today = new Date();
      const start = new Date(this.user.created_at);
      const diff = today.getTime() - start.getTime();
      return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
    }
    return 0;
  }

  /**
   * Carica il profilo utente
   */
  async loadUserProfile(event?: any) {
    if (!event) {
      this.isLoading = true;
    }

    try {
      const userProfile = await this.apiService.getUserProfile().toPromise();
      if (userProfile && userProfile.data) {
        const data = userProfile.data;
        let user: any = (typeof data === 'object' && 'user' in data) ? (data as any).user : data;
        // Mappa date e fallback
        user = {
          ...user,
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : (user.date_of_birth ? new Date(user.date_of_birth) : undefined),
          createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
        };
        // Merge activeGoal as nutritionGoals if presente
        if (typeof data === 'object' && 'activeGoal' in data && data.activeGoal) {
          user.nutritionGoals = (data as any).activeGoal;
        }
        this.user = user;
      }
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
