import { Component, OnInit, inject } from '@angular/core';
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
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonIcon,
  IonSpinner,
  IonChip,
  ToastController,
  LoadingController,
  AlertController,
  ActionSheetController,
  ModalController,
  IonModal
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  fitnessOutline,
  warningOutline,
  settingsOutline,
  checkmarkOutline,
  alertCircleOutline,
  flaskOutline,
  addOutline,
  createOutline,
  trashOutline,
  checkmarkCircleOutline,
  notificationsOutline,
  moonOutline, calendarOutline } from 'ionicons/icons';

import { AuthService } from '../../shared/services/auth.service';
import { ApiService } from '../../shared/services/api.service';
import { User, UserAllergy, UserAdditiveSensitivity, Allergen, Additive } from '../../shared/interfaces/types';
import { COMMON_ADDITIVES } from './common-additives';

interface PersonalFormData {
  fullName: string;
  email: string;
  birthDate: string;
  gender: string;
  height: number | null;
  weight: number | null;
  activityLevel: string;
  allergies: UserAllergy[];
  additives_sensitivity: UserAdditiveSensitivity[];
}

@Component({
  selector: 'app-edit-personal',
  templateUrl: './edit-personal.page.html',
  styleUrls: ['./edit-personal.page.scss'],
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
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonIcon,
    IonSpinner,
    IonChip,
    IonModal
  ]
})
export class EditPersonalPage implements OnInit {
  showDatePicker = false;
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);

  // Form data
  formData: PersonalFormData = {
    fullName: '',
    email: '',
    birthDate: '',
    gender: '',
    height: null,
    weight: null,
    activityLevel: '',
    allergies: [],
    additives_sensitivity: []
  };

  originalData: PersonalFormData | null = null;
  
  // State
  isLoading = false;
  isSaving = false;
  
  // Date constraints
  maxDate = new Date().toISOString();
  minDate = new Date(new Date().getFullYear() - 120, 0, 1).toISOString();

  openDatePicker() {
    this.showDatePicker = true;
  }

  onDateSelected(event: any) {
    this.formData.birthDate = event.detail.value; // ISO string
    this.showDatePicker = false;
    this.markAsChanged();
  }

  // Available options
  availableAllergens: Allergen[] = [
    { code: 'nuts', name: 'Frutta a guscio', category: 'food' },
    { code: 'milk', name: 'Latte', category: 'food' },
    { code: 'egg', name: 'Uovo', category: 'food' },
    { code: 'soybeans', name: 'Soia', category: 'food' },
    { code: 'peanuts', name: 'Arachidi', category: 'food' },
    { code: 'gluten', name: 'Glutine', category: 'food' },
    { code: 'fish', name: 'Pesce', category: 'food' },
    { code: 'crustaceans', name: 'Crostacei', category: 'food' },
    { code: 'molluscs', name: 'Molluschi', category: 'food' },
    { code: 'sesame', name: 'Sesamo', category: 'food' },
    { code: 'mustard', name: 'Senape', category: 'food' },
    { code: 'celery', name: 'Sedano', category: 'food' },
    { code: 'lupin', name: 'Lupino', category: 'food' },
    { code: 'sulphur-dioxide', name: 'Anidride solforosa', category: 'additive' },
    { code: 'wheat', name: 'Frumento', category: 'food' },
    { code: 'barley', name: 'Orzo', category: 'food' },
    { code: 'rye', name: 'Segale', category: 'food' },
    { code: 'oats', name: 'Avena', category: 'food' },
    { code: 'hazelnuts', name: 'Nocciole', category: 'food' },
    { code: 'almonds', name: 'Mandorle', category: 'food' },
    { code: 'walnuts', name: 'Noci', category: 'food' },
    { code: 'cashews', name: 'Anacardi', category: 'food' },
    { code: 'pistachios', name: 'Pistacchi', category: 'food' },
    { code: 'pecans', name: 'Noci pecan', category: 'food' },
    { code: 'macadamia', name: 'Noci macadamia', category: 'food' },
    { code: 'brazil-nuts', name: 'Noci del Brasile', category: 'food' },
    { code: 'shellfish', name: 'Crostacei', category: 'food' },
    { code: 'shrimp', name: 'Gamberi', category: 'food' },
    { code: 'scallops', name: 'Capesante', category: 'food' },
    { code: 'clams', name: 'Vongole', category: 'food' },
    { code: 'mussels', name: 'Cozze', category: 'food' },
    { code: 'octopus', name: 'Polpo', category: 'food' },
    { code: 'squid', name: 'Calamaro', category: 'food' },
    { code: 'corn', name: 'Mais', category: 'food' },
    { code: 'chicken', name: 'Pollo', category: 'food' },
    { code: 'beef', name: 'Manzo', category: 'food' },
    { code: 'pork', name: 'Maiale', category: 'food' },
    { code: 'turkey', name: 'Tacchino', category: 'food' },
    { code: 'fruit', name: 'Frutta', category: 'food' },
    { code: 'vegetables', name: 'Verdure', category: 'food' },
    { code: 'legumes', name: 'Legumi', category: 'food' },
    { code: 'sesame-seeds', name: 'Semi di sesamo', category: 'food' },
    { code: 'sunflower-seeds', name: 'Semi di girasole', category: 'food' },
    { code: 'mustard-seeds', name: 'Semi di senape', category: 'food' },
    { code: 'sulphites', name: 'Solfiti', category: 'additive' },
    { code: 'yeast', name: 'Lievito', category: 'food' },
  ];

  availableAdditives: Additive[] = [...COMMON_ADDITIVES];

  constructor() {
    addIcons({checkmarkOutline,personOutline,calendarOutline,fitnessOutline,warningOutline,alertCircleOutline,addOutline,createOutline,trashOutline,checkmarkCircleOutline,flaskOutline,settingsOutline,notificationsOutline,moonOutline});
  }

  async ngOnInit() {
    await this.loadUserData();
    // Carica allergeni e additivi dal server (per ID)
    await this.loadAllergiesFromServer();
    await this.loadAdditivesFromServer();
  }

  async loadAllergiesFromServer() {
    try {
      const res = await this.apiService.getUserAllergies().toPromise();
      if (res && res.data) {
        this.formData.allergies = res.data;
      }
    } catch (e) { /* fallback: lascia la lista vuota */ }
  }

  async loadAdditivesFromServer() {
    try {
      const res = await this.apiService.getUserAdditives().toPromise();
      if (res && res.data) {
        this.formData.additives_sensitivity = res.data;
      }
    } catch (e) { /* fallback: lascia la lista vuota */ }
  }

  /**
   * Load user data
   */
  async loadUserData() {
    this.isLoading = true;
    try {
      const userProfile = await this.apiService.getUserProfile().toPromise();
      if (userProfile && userProfile.data) {
        const data = userProfile.data;
        // Type guard: check if data has 'user' property
        const user = (typeof data === 'object' && 'user' in data) ? (data as any).user : data;
        // Normalizza la data di nascita in formato yyyy-MM-dd
        let birthDateRaw = user.birthDate || user.birth_date || user.date_of_birth || '';
        let birthDate = '';
        if (birthDateRaw) {
          // Se è già yyyy-MM-dd, usala direttamente
          if (/^\d{4}-\d{2}-\d{2}$/.test(birthDateRaw)) {
            birthDate = birthDateRaw;
          } else {
            const d = new Date(birthDateRaw);
            if (!isNaN(d.getTime())) {
              birthDate = d.toISOString().slice(0, 10);
            }
          }
        }
        console.log('BIRTHDATE', birthDateRaw, birthDate);
        this.formData = {
          fullName: user.name || user.fullName || user.firstName || user.lastName ? (user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()) : '',
          email: user.email || '',
          birthDate,
          gender: (user.gender && ['male','female','other','prefer_not_to_say'].includes(user.gender) ? user.gender : 'other') as 'male' | 'female' | 'other' | 'prefer_not_to_say',
          height: user.height || null,
          weight: user.weight || null,
          activityLevel: user.activity_level || '',
          allergies: user.allergies || [],
          additives_sensitivity: user.additives_sensitivity || []
        };
        this.originalData = JSON.parse(JSON.stringify(this.formData));
      }
    } catch (error) {
      console.error('Errore caricamento dati utente:', error);
      await this.showToast('Errore nel caricamento dei dati', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Check if form has changes
   */
  hasChanges(): boolean {
    if (!this.originalData) return false;
    return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
  }

  /**
   * Mark form as changed
   */
  markAsChanged() {
    // This method is called on input changes to trigger change detection
  }

  /**
   * Save changes
   */
  async saveChanges() {
    if (!this.hasChanges()) {
      await this.showToast('Nessuna modifica da salvare', 'warning');
      return;
    }
    this.isSaving = true;
    try {
      const loading = await this.loadingController.create({
        message: 'Salvataggio...',
        duration: 10000
      });
      await loading.present();
      // Prepara payload solo con i dati anagrafici (NO allergeni/additivi)
      // Prepara payload solo con i campi accettati dal backend

      // Mappa i campi frontend -> backend
      const payload: any = {
        name: this.formData.fullName,
        email: this.formData.email,
        date_of_birth: this.formData.birthDate,
        gender: this.formData.gender,
        height: this.formData.height,
        weight: this.formData.weight,
        activity_level: this.formData.activityLevel
      };
      // Conversioni compatibilità backend
      if (payload.height === null) delete payload.height;
      if (payload.weight === null) delete payload.weight;
      if (payload.gender && !['male','female','other','prefer_not_to_say'].includes(payload.gender)) payload.gender = 'other';
      await this.apiService.updateUserProfile(payload).toPromise();
      await loading.dismiss();
      // Aggiorna originalData solo per i dati anagrafici
      this.originalData = JSON.parse(JSON.stringify({ ...this.formData, allergies: this.formData.allergies, additives_sensitivity: this.formData.additives_sensitivity }));
  await this.showToast('Dati salvati con successo!', 'success');
  // Ricarica i dati dal backend per essere sicuri che siano aggiornati
  await this.loadUserData();
    } catch (error) {
      console.error('Errore salvataggio:', error);
      let errorMsg = 'Errore durante il salvataggio';
      const err: any = error;
      if (err?.error?.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
        // Mostra il primo errore dettagliato
        errorMsg = err.error.errors[0].message || err.error.errors[0];
      } else if (err?.error?.message) {
        errorMsg = err.error.message;
      }
      await this.showToast(errorMsg, 'danger');
    } finally {
      this.isSaving = false;
      try {
        const loading = await this.loadingController.getTop();
        if (loading) {
          await loading.dismiss();
        }
      } catch (e) {}
    }
  }

  /**
   * Allergy management
   */
  async addAllergy() {
    const availableOptions = this.availableAllergens.filter(allergen => 
      !this.formData.allergies.some(existing => existing.allergen_code === allergen.code)
    );
    if (availableOptions.length === 0) {
      await this.showToast('Tutti gli allergeni disponibili sono già stati aggiunti', 'warning');
      return;
    }
    const buttons: any[] = availableOptions.map(allergen => ({
      text: allergen.name,
      handler: () => {
        this.showAllergySeveritySelection(allergen);
      }
    }));
    buttons.push({ text: 'Annulla', role: 'cancel' });
    const actionSheet = await this.actionSheetController.create({ header: 'Seleziona Allergene', buttons });
    await actionSheet.present();
  }

  async showAllergySeveritySelection(allergen: Allergen) {
  const alert = await this.alertController.create({
      header: 'Livello di Severità',
      subHeader: allergen.name,
      message: 'Seleziona il livello di severità per questo allergene',
      inputs: [
        { name: 'severity', type: 'radio', label: 'Lieve', value: 'mild', checked: false },
        { name: 'severity', type: 'radio', label: 'Moderata', value: 'moderate', checked: false },
        { name: 'severity', type: 'radio', label: 'Severa', value: 'severe', checked: false }
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Aggiungi',
          handler: async (data: any) => {
            if (data) {
              try {
                await this.apiService.addUserAllergy({
                  allergen_code: allergen.code,
                  allergen_name: allergen.name,
                  severity: data
                }).toPromise();
                await this.loadAllergiesFromServer();
                this.markAsChanged();
                await this.showToast('Allergene aggiunto', 'success');
              } catch (e) {
                await this.showToast('Errore aggiunta allergene', 'danger');
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async editAllergy(index: number) {
  const allergy = this.formData.allergies[index];
    const alert = await this.alertController.create({
      header: 'Modifica Severità',
      subHeader: allergy.allergen_name,
      inputs: [
        { name: 'severity', type: 'radio', label: 'Lieve', value: 'mild', checked: allergy.severity === 'mild' },
        { name: 'severity', type: 'radio', label: 'Moderata', value: 'moderate', checked: allergy.severity === 'moderate' },
        { name: 'severity', type: 'radio', label: 'Severa', value: 'severe', checked: allergy.severity === 'severe' }
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Salva',
          handler: async (data) => {
            if (allergy.id == null) {
              await this.showToast('Impossibile modificare: allergene senza ID', 'danger');
              return;
            }
            try {
              await this.apiService.updateUserAllergy(allergy.id, { severity: data }).toPromise();
              await this.loadAllergiesFromServer();
              this.markAsChanged();
              await this.showToast('Severità aggiornata', 'success');
            } catch (e) {
              await this.showToast('Errore aggiornamento severità', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async removeAllergy(index: number) {
  const allergy = this.formData.allergies[index];
    const alert = await this.alertController.create({
      header: 'Rimuovi Allergene',
      message: `Sei sicuro di voler rimuovere "${allergy.allergen_name}" dalla lista degli allergeni?`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Rimuovi', role: 'destructive', handler: async () => {
            if (allergy.id == null) {
              await this.showToast('Impossibile rimuovere: allergene senza ID', 'danger');
              return;
            }
            try {
              await this.apiService.deleteUserAllergy(allergy.id).toPromise();
              await this.loadAllergiesFromServer();
              this.markAsChanged();
              await this.showToast('Allergene rimosso', 'success');
            } catch (e) {
              await this.showToast('Errore rimozione allergene', 'danger');
            }
          } }
      ]
    });
    await alert.present();
  }

  /**
   * Additive management
   */
  async addAdditive() {
    const availableOptions = this.availableAdditives.filter(additive => 
      !this.formData.additives_sensitivity.some(existing => existing.additive_code === additive.code)
    );
    if (availableOptions.length === 0) {
      await this.showToast('Tutti gli additivi disponibili sono già stati aggiunti', 'warning');
      return;
    }
    const buttons: any[] = availableOptions.map(additive => ({
      text: `${additive.name} (${additive.code})`,
      handler: () => {
        this.showAdditiveSensitivitySelection(additive);
      }
    }));
    buttons.push({ text: 'Annulla', role: 'cancel' });
    const actionSheet = await this.actionSheetController.create({ header: 'Seleziona Additivo', buttons });
    await actionSheet.present();
  }

  async showAdditiveSensitivitySelection(additive: Additive) {
    const alert = await this.alertController.create({
      header: 'Livello di Sensibilità',
      subHeader: additive.name,
      message: 'Seleziona il livello di sensibilità per questo additivo',
      inputs: [
        { name: 'sensitivity', type: 'radio', label: 'Bassa', value: 'low', checked: true },
        { name: 'sensitivity', type: 'radio', label: 'Media', value: 'medium' },
        { name: 'sensitivity', type: 'radio', label: 'Alta', value: 'high' }
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Aggiungi',
          handler: async (data) => {
            try {
              await this.apiService.addUserAdditive({
                additive_code: additive.code,
                additive_name: additive.name,
                sensitivity_level: data
              }).toPromise();
              await this.loadAdditivesFromServer();
              this.markAsChanged();
              await this.showToast('Additivo aggiunto', 'success');
            } catch (e) {
              await this.showToast('Errore aggiunta additivo', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async editAdditive(index: number) {
    const additive = this.formData.additives_sensitivity[index];
    const alert = await this.alertController.create({
      header: 'Modifica Sensibilità',
      subHeader: additive.additive_name,
      inputs: [
        { name: 'sensitivity', type: 'radio', label: 'Bassa', value: 'low', checked: additive.sensitivity_level === 'low' },
        { name: 'sensitivity', type: 'radio', label: 'Media', value: 'medium', checked: additive.sensitivity_level === 'medium' },
        { name: 'sensitivity', type: 'radio', label: 'Alta', value: 'high', checked: additive.sensitivity_level === 'high' }
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Salva',
          handler: async (data) => {
            if (additive.id == null) {
              await this.showToast('Impossibile modificare: additivo senza ID', 'danger');
              return;
            }
            try {
              await this.apiService.updateUserAdditive(additive.id, { sensitivity_level: data }).toPromise();
              await this.loadAdditivesFromServer();
              this.markAsChanged();
              await this.showToast('Sensibilità aggiornata', 'success');
            } catch (e) {
              await this.showToast('Errore aggiornamento sensibilità', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async removeAdditive(index: number) {
    const additive = this.formData.additives_sensitivity[index];
    const alert = await this.alertController.create({
      header: 'Rimuovi Additivo',
      message: `Sei sicuro di voler rimuovere "${additive.additive_name}" dalla lista degli additivi sensibili?`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Rimuovi', role: 'destructive', handler: async () => {
            if (additive.id == null) {
              await this.showToast('Impossibile rimuovere: additivo senza ID', 'danger');
              return;
            }
            try {
              await this.apiService.deleteUserAdditive(additive.id).toPromise();
              await this.loadAdditivesFromServer();
              this.markAsChanged();
              await this.showToast('Additivo rimosso', 'success');
            } catch (e) {
              await this.showToast('Errore rimozione additivo', 'danger');
            }
          } }
      ]
    });
    await alert.present();
  }

  /**
   * Helper methods
   */
  getAllergySeverityColor(severity: string): string {
    switch (severity) {
      case 'severe': return 'danger';
      case 'moderate': return 'warning';
      case 'mild': return 'medium';
      default: return 'medium';
    }
  }

  getAdditiveSensitivityColor(level: string): string {
    switch (level) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'severe': return 'Severa';
      case 'moderate': return 'Moderata';
      case 'mild': return 'Lieve';
      default: return 'N/A';
    }
  }

  getSensitivityLabel(level: string): string {
    switch (level) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Bassa';
      default: return 'N/A';
    }
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode(event: any) {
    const isDark = event.detail.checked;
    document.body.classList.toggle('dark', isDark);
  }

  /**
   * Show toast message
   */
  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }
}
