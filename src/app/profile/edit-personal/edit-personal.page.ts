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
  IonToggle,
  IonIcon,
  IonSpinner,
  IonChip,
  ToastController,
  LoadingController,
  AlertController,
  ActionSheetController,
  ModalController
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
  moonOutline
} from 'ionicons/icons';

import { AuthService } from '../../shared/services/auth.service';
import { ApiService } from '../../shared/services/api.service';
import { User, UserAllergy, UserAdditiveSensitivity, Allergen, Additive } from '../../shared/interfaces/types';

interface PersonalFormData {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  gender: string;
  height: number | null;
  weight: number | null;
  activityLevel: string;
  allergies: UserAllergy[];
  additives_sensitivity: UserAdditiveSensitivity[];
  preferences: {
    notifications: boolean;
    darkMode: boolean;
  };
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
  // IonToggle rimosso
    IonIcon,
    IonSpinner,
    IonChip
  ]
})
export class EditPersonalPage implements OnInit {
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
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    gender: '',
    height: null,
    weight: null,
    activityLevel: '',
    allergies: [],
    additives_sensitivity: [],
    preferences: {
      notifications: true,
      darkMode: false
    }
  };

  originalData: PersonalFormData | null = null;
  
  // State
  isLoading = false;
  isSaving = false;
  
  // Date constraints
  maxDate = new Date().toISOString();
  minDate = new Date(new Date().getFullYear() - 120, 0, 1).toISOString();

  // Available options
  availableAllergens: Allergen[] = [
    { code: 'nuts', name: 'Frutta a guscio', category: 'food' },
    { code: 'milk', name: 'Latte e derivati', category: 'food' },
    { code: 'eggs', name: 'Uova', category: 'food' },
    { code: 'fish', name: 'Pesce', category: 'food' },
    { code: 'shellfish', name: 'Crostacei', category: 'food' },
    { code: 'soy', name: 'Soia', category: 'food' },
    { code: 'wheat', name: 'Glutine/Frumento', category: 'food' },
    { code: 'sesame', name: 'Semi di sesamo', category: 'food' },
    { code: 'celery', name: 'Sedano', category: 'food' },
    { code: 'mustard', name: 'Senape', category: 'food' },
    { code: 'lupin', name: 'Lupini', category: 'food' },
    { code: 'sulfites', name: 'Anidride solforosa e solfiti', category: 'additive' }
  ];

  availableAdditives: Additive[] = [
    { code: 'E621', name: 'Glutammato monosodico (MSG)', category: 'flavor_enhancer' },
    { code: 'E102', name: 'Tartrazina', category: 'colorant' },
    { code: 'E110', name: 'Giallo tramonto FCF', category: 'colorant' },
    { code: 'E124', name: 'Rosso cocciniglia A', category: 'colorant' },
    { code: 'E129', name: 'Rosso allura AC', category: 'colorant' },
    { code: 'E951', name: 'Aspartame', category: 'sweetener' },
    { code: 'E950', name: 'Acesulfame K', category: 'sweetener' },
    { code: 'E211', name: 'Benzoato di sodio', category: 'preservative' },
    { code: 'E220', name: 'Anidride solforosa', category: 'preservative' },
    { code: 'E320', name: 'BHA (butilidrossianisolo)', category: 'antioxidant' }
  ];

  constructor() {
    addIcons({
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
      moonOutline
    });
  }

  async ngOnInit() {
    await this.loadUserData();
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
        this.formData = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          birthDate: user.birthDate || user.birth_date || '',
          gender: (user.gender && ['male','female','other','prefer_not_to_say'].includes(user.gender) ? user.gender : 'other') as 'male' | 'female' | 'other' | 'prefer_not_to_say',
          height: user.height || null,
          weight: user.weight || null,
          activityLevel: user.activity_level || '',
          allergies: user.allergies || [],
          additives_sensitivity: user.additives_sensitivity || [],
          preferences: user.preferences
            ? { notifications: user.preferences.notifications ?? true, darkMode: user.preferences.darkMode ?? false }
            : { notifications: true, darkMode: false }
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

      // Chiamata reale al backend
      // Mappo i campi per compatibilità backend
      const payload: Partial<User> = {
        ...this.formData,
        height: this.formData.height === null ? undefined : this.formData.height,
        weight: this.formData.weight === null ? undefined : this.formData.weight,
        gender: (this.formData.gender && ['male','female','other','prefer_not_to_say'].includes(this.formData.gender) ? this.formData.gender : 'other') as 'male' | 'female' | 'other' | 'prefer_not_to_say',
        activity_level: (this.formData.activityLevel as 'light' | 'sedentary' | 'moderate' | 'active' | 'very_active' | undefined),
        preferences: {
          ...this.formData.preferences
        }
      };
      if ('activityLevel' in payload) {
        delete (payload as any).activityLevel;
      }
      await this.apiService.updateUserProfile(payload).toPromise();

      await loading.dismiss();
      this.originalData = JSON.parse(JSON.stringify(this.formData));
      await this.showToast('Dati salvati con successo!', 'success');
      // Naviga e forza refresh profilo
      this.router.navigate(['/profile'], { state: { refresh: true } });
    } catch (error) {
      console.error('Errore salvataggio:', error);
      await this.showToast('Errore durante il salvataggio', 'danger');
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

    buttons.push({
      text: 'Annulla',
      role: 'cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Seleziona Allergene',
      buttons
    });

    await actionSheet.present();
  }

  async showAllergySeveritySelection(allergen: Allergen) {
    const alert = await this.alertController.create({
      header: 'Livello di Severità',
      subHeader: allergen.name,
      message: 'Seleziona il livello di severità per questo allergene',
      inputs: [
        {
          name: 'severity',
          type: 'radio',
          label: 'Lieve',
          value: 'mild',
          checked: true
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Moderata',
          value: 'moderate'
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Severa',
          value: 'severe'
        }
      ],
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Aggiungi',
          handler: (data) => {
            const newAllergy: UserAllergy = {
              allergen_code: allergen.code,
              allergen_name: allergen.name,
              severity: data
            };
            this.formData.allergies.push(newAllergy);
            this.markAsChanged();
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
        {
          name: 'severity',
          type: 'radio',
          label: 'Lieve',
          value: 'mild',
          checked: allergy.severity === 'mild'
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Moderata',
          value: 'moderate',
          checked: allergy.severity === 'moderate'
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Severa',
          value: 'severe',
          checked: allergy.severity === 'severe'
        }
      ],
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Salva',
          handler: (data) => {
            this.formData.allergies[index].severity = data;
            this.markAsChanged();
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
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Rimuovi',
          role: 'destructive',
          handler: () => {
            this.formData.allergies.splice(index, 1);
            this.markAsChanged();
          }
        }
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

    buttons.push({
      text: 'Annulla',
      role: 'cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Seleziona Additivo',
      buttons
    });

    await actionSheet.present();
  }

  async showAdditiveSensitivitySelection(additive: Additive) {
    const alert = await this.alertController.create({
      header: 'Livello di Sensibilità',
      subHeader: additive.name,
      message: 'Seleziona il livello di sensibilità per questo additivo',
      inputs: [
        {
          name: 'sensitivity',
          type: 'radio',
          label: 'Bassa',
          value: 'low',
          checked: true
        },
        {
          name: 'sensitivity',
          type: 'radio',
          label: 'Media',
          value: 'medium'
        },
        {
          name: 'sensitivity',
          type: 'radio',
          label: 'Alta',
          value: 'high'
        }
      ],
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Aggiungi',
          handler: (data) => {
            const newAdditive: UserAdditiveSensitivity = {
              additive_code: additive.code,
              additive_name: additive.name,
              sensitivity_level: data
            };
            this.formData.additives_sensitivity.push(newAdditive);
            this.markAsChanged();
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
        {
          name: 'sensitivity',
          type: 'radio',
          label: 'Bassa',
          value: 'low',
          checked: additive.sensitivity_level === 'low'
        },
        {
          name: 'sensitivity',
          type: 'radio',
          label: 'Media',
          value: 'medium',
          checked: additive.sensitivity_level === 'medium'
        },
        {
          name: 'sensitivity',
          type: 'radio',
          label: 'Alta',
          value: 'high',
          checked: additive.sensitivity_level === 'high'
        }
      ],
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Salva',
          handler: (data) => {
            this.formData.additives_sensitivity[index].sensitivity_level = data;
            this.markAsChanged();
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
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Rimuovi',
          role: 'destructive',
          handler: () => {
            this.formData.additives_sensitivity.splice(index, 1);
            this.markAsChanged();
          }
        }
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
