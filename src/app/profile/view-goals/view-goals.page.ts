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

  // State
  isLoading = false;
  user: User | null = null;
  currentGoal: GoalType = 'maintain_weight';
  calculatedGoals: CalculatedGoals | null = null;

  // User data for calculations
  userAge = 0;
  userWeight = 0;
  userHeight = 0;
  userGender: string = '';
  userActivityLevel: string = '';

  // Exposed Math for template
  Math = Math;

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
    // Device detection
    this.deviceInfo = this.deviceService.getDeviceInfo();
    this.isDesktop = this.deviceInfo.isDesktop;
    this.isMobile = this.deviceInfo.isMobile;
    
    this.isLoading = true;
    
    try {
      // In a real app, you would fetch from API
      // For now, using mock data
      const mockUser: User = {
        id: 1,
        firstName: 'Mario',
        lastName: 'Rossi',
        email: 'mario.rossi@email.com',
        birthDate: '1990-05-15',
        gender: 'male',
        height: 175,
        weight: 70.5,
        activity_level: 'moderate',
        preferences: {
          notifications: true,
          darkMode: false,
          units: 'metric'
        },
        totalMeals: 145,
        currentStreak: 7,
        joinDate: new Date('2024-01-15'),
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      this.user = mockUser;
      
      // Extract user data for calculations
      this.userAge = this.calculateAge(mockUser.birthDate || '1990-05-15');
      this.userWeight = mockUser.weight || 70;
      this.userHeight = mockUser.height || 175;
      this.userGender = mockUser.gender || 'male';
      this.userActivityLevel = mockUser.activity_level || 'moderate';

      // Get current goal (in a real app, this would be stored in user preferences)
      this.currentGoal = 'maintain_weight'; // Default goal

      // Calculate nutrition goals
      this.calculateGoals();

    } catch (error) {
      console.error('Errore caricamento dati utente:', error);
      await this.showToast('Errore nel caricamento dei dati', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Calculate age from birth date
   */
  private calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Calculate nutrition goals using scientific formulas
   */
  calculateGoals() {
    if (!this.user) return;

    // 1. Calculate BMR using Mifflin-St Jeor equation
    const bmr = this.calculateBMR();
    
    // 2. Calculate TDEE (Total Daily Energy Expenditure)
    const activityMultiplier = this.getActivityMultiplierValue();
    const tdee = Math.round(bmr * activityMultiplier);
    
    // 3. Calculate activity calories
    const activityCalories = tdee - bmr;
    
    // 4. Apply goal adjustment
    const goalAdjustment = this.getGoalAdjustment();
    const dailyCalories = tdee + goalAdjustment;
    
    // 5. Calculate macronutrients
    const macros = this.calculateMacros(dailyCalories);
    
    // 6. Calculate water intake
    const dailyWater = this.calculateWaterIntake();

    this.calculatedGoals = {
      bmr: Math.round(bmr),
      tdee,
      dailyCalories,
      activityCalories: Math.round(activityCalories),
      goalAdjustment,
      dailyWater,
      waterIntake: dailyWater, // Alias
      macros: {
        ...macros,
        // Structured versions for easier template access
        proteins: {
          grams: macros.proteinGrams,
          calories: macros.proteinCalories,
          percentage: macros.proteinPercentage
        },
        carbohydrates: {
          grams: macros.carbsGrams,
          calories: macros.carbsCalories,
          percentage: macros.carbsPercentage
        },
        fats: {
          grams: macros.fatsGrams,
          calories: macros.fatsCalories,
          percentage: macros.fatsPercentage
        }
      }
    };
  }

  /**
   * Calculate BMR using Mifflin-St Jeor equation
   */
  private calculateBMR(): number {
    if (this.userGender === 'male') {
      return (10 * this.userWeight) + (6.25 * this.userHeight) - (5 * this.userAge) + 5;
    } else {
      return (10 * this.userWeight) + (6.25 * this.userHeight) - (5 * this.userAge) - 161;
    }
  }

  /**
   * Get activity multiplier value
   */
  private getActivityMultiplierValue(): number {
    const multipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    };
    return multipliers[this.userActivityLevel as keyof typeof multipliers] || 1.55;
  }

  /**
   * Get goal adjustment in calories
   */
  private getGoalAdjustment(): number {
    const adjustments = {
      'lose_weight': -500,    // 0.5kg per week loss
      'maintain_weight': 0,   // Maintenance
      'gain_muscle': +300,    // Lean bulk
      'gain_weight': +500     // 0.5kg per week gain
    };
    return adjustments[this.currentGoal];
  }

  /**
   * Calculate macronutrient distribution
   */
  private calculateMacros(totalCalories: number) {
    // Macronutrient ratios based on goal
    let proteinRatio: number, carbsRatio: number, fatsRatio: number;
    
    switch (this.currentGoal) {
      case 'lose_weight':
        proteinRatio = 0.30; // Higher protein for satiety and muscle preservation
        carbsRatio = 0.40;
        fatsRatio = 0.30;
        break;
      case 'gain_muscle':
        proteinRatio = 0.25; // Adequate protein for muscle building
        carbsRatio = 0.45;   // Higher carbs for energy
        fatsRatio = 0.30;
        break;
      case 'gain_weight':
        proteinRatio = 0.20;
        carbsRatio = 0.50;   // Highest carbs for weight gain
        fatsRatio = 0.30;
        break;
      default: // maintain_weight
        proteinRatio = 0.25;
        carbsRatio = 0.45;
        fatsRatio = 0.30;
        break;
    }

    // Calculate calories for each macro
    const proteinCalories = Math.round(totalCalories * proteinRatio);
    const carbsCalories = Math.round(totalCalories * carbsRatio);
    const fatsCalories = Math.round(totalCalories * fatsRatio);

    // Calculate grams (protein: 4kcal/g, carbs: 4kcal/g, fats: 9kcal/g)
    const proteinGrams = Math.round(proteinCalories / 4);
    const carbsGrams = Math.round(carbsCalories / 4);
    const fatsGrams = Math.round(fatsCalories / 9);

    return {
      proteinGrams,
      proteinCalories,
      proteinPercentage: Math.round(proteinRatio * 100),
      carbsGrams,
      carbsCalories,
      carbsPercentage: Math.round(carbsRatio * 100),
      fatsGrams,
      fatsCalories,
      fatsPercentage: Math.round(fatsRatio * 100)
    };
  }

  /**
   * Calculate daily water intake
   */
  private calculateWaterIntake(): number {
    // Base water intake: 35ml per kg of body weight
    let waterML = this.userWeight * 35;
    
    // Add extra for activity level
    const activityBonus = {
      'sedentary': 0,
      'light': 200,
      'moderate': 400,
      'active': 600,
      'very_active': 800
    };
    
    waterML += activityBonus[this.userActivityLevel as keyof typeof activityBonus] || 400;
    
    // Convert to liters and round to 1 decimal
    return Math.round((waterML / 1000) * 10) / 10;
  }

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
          handler: (data) => {
            if (data !== this.currentGoal) {
              this.currentGoal = data;
              this.calculateGoals();
              this.showToast('Obiettivo aggiornato! I valori sono stati ricalcolati.', 'success');
            }
          }
        }
      ]
    });

    await alert.present();
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
    if (this.calculatedGoals!.goalAdjustment > 0) {
      return 'Surplus per Obiettivo';
    } else if (this.calculatedGoals!.goalAdjustment < 0) {
      return 'Deficit per Obiettivo';
    } else {
      return 'Mantenimento';
    }
  }

  getFormulaUsed(): string {
    return 'Mifflin-St Jeor';
  }

  getUserGender(): string {
    return this.userGender === 'male' ? 'Maschio' : 'Femmina';
  }

  getActivityMultiplier(): string {
    return this.getActivityMultiplierValue().toString();
  }

  getActivityLevelLabel(level: string): string {
    switch (level) {
      case 'sedentary': return 'Sedentario';
      case 'light': return 'Leggermente Attivo';
      case 'moderate': return 'Moderatamente Attivo';
      case 'very_active': return 'Molto Attivo';
      case 'extra_active': return 'Estremamente Attivo';
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
