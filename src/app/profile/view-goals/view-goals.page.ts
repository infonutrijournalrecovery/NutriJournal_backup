import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
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
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonChip,
  IonAccordionGroup,
  IonAccordion,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  pushOutline,
  flameOutline,
  nutritionOutline,
  water,
  calculatorOutline,
  pulseOutline,
  fitnessOutline,
  createOutline,
  refreshOutline,
  bulbOutline,
  leafOutline,
  waterOutline,
  trendingUpOutline,
  trendingDownOutline,
  removeOutline
} from 'ionicons/icons';

import { AuthService } from '../../shared/services/auth.service';
import { ApiService } from '../../shared/services/api.service';
import { DeviceService, DeviceInfo } from '../../shared/services/device.service';
import { User } from '../../shared/interfaces/types';

interface CalculatedGoals {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  activityCalories: number;
  goalAdjustment: number;
  dailyWater: number;
  waterIntake: number; // Alias for dailyWater
  macros: {
    proteinGrams: number;
    proteinCalories: number;
    proteinPercentage: number;
    carbsGrams: number;
    carbsCalories: number;
    carbsPercentage: number;
    fatsGrams: number;
    fatsCalories: number;
    fatsPercentage: number;
    // Structured versions for easier access
    proteins: {
      grams: number;
      calories: number;
      percentage: number;
    };
    carbohydrates: {
      grams: number;
      calories: number;
      percentage: number;
    };
    fats: {
      grams: number;
      calories: number;
      percentage: number;
    };
  };
}

type GoalType = 'lose_weight' | 'maintain_weight' | 'gain_muscle' | 'gain_weight';

@Component({
  selector: 'app-view-goals',
  templateUrl: './view-goals.page.html',
  styleUrls: ['./view-goals.page.scss'],
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
    IonItem,
    IonLabel,
    IonIcon,
    IonSpinner,
    IonChip,
    IonAccordionGroup,
    IonAccordion
  ]
})
export class ViewGoalsPage implements OnInit {
  @ViewChild('macrosChart', { static: false }) macrosChartRef!: ElementRef<HTMLCanvasElement>;

  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private deviceService = inject(DeviceService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  // Device info
  deviceInfo: DeviceInfo | null = null;
  isDesktop = false;
  isMobile = false;

  isLoading = false;
  user: User | null = null;
  currentGoal: GoalType = 'maintain_weight';
  activeGoal: any = null; // Dati obiettivo dal backend

  constructor() {
    addIcons({
      pushOutline,
      flameOutline,
      nutritionOutline,
      water,
      calculatorOutline,
      pulseOutline,
      fitnessOutline,
      createOutline,
      refreshOutline,
      bulbOutline,
      leafOutline,
      waterOutline,
      trendingUpOutline,
      trendingDownOutline,
      removeOutline
    });
  }

  async ngOnInit() {
  await this.loadUserData();
  }

  /**
   * Load user data and calculate goals
   */
  async loadUserData() {
    this.deviceInfo = this.deviceService.getDeviceInfo();
    this.isDesktop = this.deviceInfo.isDesktop;
    this.isMobile = this.deviceInfo.isMobile;
    this.isLoading = true;
    try {
      const response = await this.apiService.getUserProfile().toPromise();
      const data = response?.data;
      if (!data) throw new Error('Dati utente non disponibili');
      // Support both { user, activeGoal } and flat user
      const user = (typeof data === 'object' && 'user' in data) ? (data as any).user : data;
      this.user = user;
      // Ottieni l'obiettivo attivo dal backend
      this.activeGoal = (typeof data === 'object' && 'activeGoal' in data) ? (data as any).activeGoal : user.nutritionGoals || null;
      this.currentGoal = this.activeGoal?.goal_type || user.goal || 'maintain_weight';
    } catch (error) {
      console.error('Errore caricamento dati utente:', error);
      await this.showToast('Errore nel caricamento dei dati', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // Tutta la logica di calcolo locale rimossa: ora si usano solo i dati da this.activeGoal

  /**
   * Select new goal
   */
  async selectGoal() {
    const alert = await this.alertController.create({
      header: 'Seleziona il Tuo Obiettivo',
      message: 'Scegli l\'obiettivo che vuoi raggiungere:',
      inputs: [
        {
          name: 'goal',
          type: 'radio',
          label: 'Perdere Peso',
          value: 'lose_weight',
          checked: this.currentGoal === 'lose_weight'
        },
        {
          name: 'goal',
          type: 'radio',
          label: 'Mantenere il Peso',
          value: 'maintain_weight',
          checked: this.currentGoal === 'maintain_weight'
        },
        {
          name: 'goal',
          type: 'radio',
          label: 'Aumentare Massa Muscolare',
          value: 'gain_muscle',
          checked: this.currentGoal === 'gain_muscle'
        },
        {
          name: 'goal',
          type: 'radio',
          label: 'Aumentare Peso',
          value: 'gain_weight',
          checked: this.currentGoal === 'gain_weight'
        }
      ],
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Conferma',
          handler: async (data) => {
            if (data !== this.currentGoal) {
              // Mostra loading
              this.isLoading = true;
              try {
                // Aggiorna obiettivo nel backend
                await this.apiService.updateUserProfile({ goal: data }).toPromise();
                this.currentGoal = data;
                await this.loadUserData();
                await this.showToast('Obiettivo aggiornato e salvato!', 'success');
              } catch (error) {
                await this.showToast('Errore nel salvataggio dell\'obiettivo', 'danger');
              } finally {
                this.isLoading = false;
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getWaterGlasses(): string | number {
      const liters = this.activeGoal?.dailyWater || this.activeGoal?.target_water_liters;
      if (typeof liters === 'number' && !isNaN(liters)) {
        return Math.round(liters * 4);
      }
      return '—';
    }
    
  /**
   * Helper methods for template
   */
  getGoalLabel(goal: GoalType): string {
    const labels = {
      'lose_weight': 'Perdere Peso',
      'maintain_weight': 'Mantenere Peso',
      'gain_muscle': 'Aumentare Massa',
      'gain_weight': 'Aumentare Peso'
    };
    return labels[goal];
  }

  getGoalColor(goal: GoalType): string {
    const colors = {
      'lose_weight': 'danger',
      'maintain_weight': 'success',
      'gain_muscle': 'primary',
      'gain_weight': 'warning'
    };
    return colors[goal];
  }

  getGoalIcon(goal: GoalType): string {
    const icons = {
      'lose_weight': 'trending-down-outline',
      'maintain_weight': 'remove-outline',
      'gain_muscle': 'fitness-outline',
      'gain_weight': 'trending-up-outline'
    };
    return icons[goal];
  }

  getGoalDescription(goal: GoalType): string {
    const descriptions = {
      'lose_weight': 'Deficit calorico per perdita di peso graduale e sostenibile',
      'maintain_weight': 'Equilibrio calorico per mantenere il peso attuale',
      'gain_muscle': 'Surplus moderato ottimizzato per la crescita muscolare',
      'gain_weight': 'Surplus calorico per aumento di peso generale'
    };
    return descriptions[goal];
  }

  getAdjustmentLabel(): string {
    if (this.activeGoal?.goal_adjustment > 0) {
      return 'Surplus per Obiettivo';
    } else if (this.activeGoal?.goal_adjustment < 0) {
      return 'Deficit per Obiettivo';
    } else {
      return 'Mantenimento';
    }
  }

  getFormulaUsed(): string {
    return 'Mifflin-St Jeor';
  }

  getUserGender(): string {
  return this.user?.gender === 'male' ? 'Maschio' : 'Femmina';
  }

  getActivityMultiplier(): string {
  return this.activeGoal?.activity_multiplier?.toString() || '';
  }

  getActivityLevelLabel(level?: string): string {
    switch (level) {
      case 'sedentary': return 'Sedentario';
      case 'light': return 'Leggermente Attivo';
      case 'moderate': return 'Moderatamente Attivo';
      case 'active': return 'Attivo';
      case 'very_active': return 'Molto Attivo';
      default: return 'Non Specificato';
    }
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
