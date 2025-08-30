import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonBadge,
  IonProgressBar,
  IonFab,
  IonFabButton,
  IonFabList,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline,
  cafeOutline,
  trendingUpOutline,
  waterOutline,
  flameOutline,
  timeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  statsChartOutline,
  restaurantOutline,
  refreshOutline, 
  nutritionOutline, 
  fitnessOutline,
  scanOutline, 
  personOutline, 
  pizzaOutline, 
  moonOutline,
  chevronBackOutline,
  chevronForwardOutline,
  calendarOutline, wineOutline, fastFoodOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';

// Commentiamo temporaneamente questi import per far funzionare l'app
// import { AuthService } from '../auth/auth.service';
// import { ApiService } from '../shared/services/api.service';
import { DeviceService } from '../shared/services/device.service';
import { User, DailyNutrition, Meal, Activity } from '../shared/interfaces/types';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonBadge,
    IonProgressBar,
    IonFab,
    IonFabButton,
    IonFabList,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton
  ]
})
export class DashboardPage implements OnInit, OnDestroy {
  user: User | null = null;
  todayNutrition: DailyNutrition | null = null;
  recentMeals: Meal[] = [];
  recentActivities: Activity[] = [];
  isLoading = false;
  selectedSegment = 'nutrition';

  // Proprietà per la navigazione temporale
  currentDate = new Date();
  
  // Proprietà per il layout responsive
  isDesktop = false;
  isTablet = false;
  isMobile = true;
  deviceLayout: 'mobile' | 'tablet' | 'desktop' = 'mobile';

  private subscriptions = new Subscription();

  // Statistiche giornaliere con nuovo sistema di calcolo
  dailyStats = {
    calories: { 
      consumed: 1847, 
      burned: 247, 
      goal: 2200, 
      adjustedGoal: 2447, // goal + burned
      percentage: 0,
      remaining: 0
    },
    carbs: { consumed: 203, goal: 275, percentage: 0 },
    proteins: { consumed: 87, goal: 110, percentage: 0 },
    fats: { consumed: 51, goal: 73, percentage: 0 },
    water: { consumed: 1250, goal: 2000 }, // ml
    activities: 3,
    // Nuovi campi per calcoli nutrizionali
    userProfile: {
      age: 30,
      weight: 70, // kg
      height: 175, // cm
      gender: 'male' as 'male' | 'female',
      activityLevel: 'moderately_active' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active',
      goal: 'maintain' as 'lose_weight' | 'maintain' | 'gain_weight' | 'gain_muscle'
    }
  };

  // Fattori attività per Harris-Benedict
  private activityFactors = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  };

  // Distribuzioni macronutrienti per obiettivi
  private macroDistributions = {
    lose_weight: { carbs: 0.4, proteins: 0.3, fats: 0.3 },
    maintain: { carbs: 0.5, proteins: 0.2, fats: 0.3 },
    gain_weight: { carbs: 0.55, proteins: 0.25, fats: 0.2 },
    gain_muscle: { carbs: 0.45, proteins: 0.3, fats: 0.25 }
  };

  // Quick actions
  quickActions = [
    { icon: 'cafe-outline', label: 'Colazione', action: 'addMeal', color: 'warning' },
    { icon: 'restaurant-outline', label: 'Pranzo', action: 'addMeal', color: 'success' },
    { icon: 'scan-outline', label: 'Scanner', action: 'openScanner', color: 'secondary' },
    { icon: 'water-outline', label: 'Acqua', action: 'addWater', color: 'primary' },
    { icon: 'trending-up-outline', label: 'Attività', action: 'addActivity', color: 'tertiary' }
  ];

  // Distribuzione ottimale dei pasti (percentuali del fabbisogno giornaliero)
  mealDistribution = {
    breakfast: { calories: 0.25, carbs: 0.30, proteins: 0.20, fats: 0.20 }, // 25% calorie, 30% carbs, etc.
    lunch: { calories: 0.35, carbs: 0.40, proteins: 0.35, fats: 0.35 },     // 35% calorie (pasto principale)
    snack: { calories: 0.15, carbs: 0.15, proteins: 0.15, fats: 0.15 },     // 15% calorie
    dinner: { calories: 0.25, carbs: 0.15, proteins: 0.30, fats: 0.30 }     // 25% calorie, meno carbs sera
  };

  // Dati nutrizionali per ogni pasto (simulati per ora)
  mealStats = {
    breakfast: {
      calories: { consumed: 0, goal: 0, percentage: 0 },
      carbs: { consumed: 0, goal: 0, percentage: 0 },
      proteins: { consumed: 0, goal: 0, percentage: 0 },
      fats: { consumed: 0, goal: 0, percentage: 0 },
      foods: [] as any[]
    },
    lunch: {
      calories: { consumed: 0, goal: 0, percentage: 0 },
      carbs: { consumed: 0, goal: 0, percentage: 0 },
      proteins: { consumed: 0, goal: 0, percentage: 0 },
      fats: { consumed: 0, goal: 0, percentage: 0 },
      foods: [] as any[]
    },
    snack: {
      calories: { consumed: 0, goal: 0, percentage: 0 },
      carbs: { consumed: 0, goal: 0, percentage: 0 },
      proteins: { consumed: 0, goal: 0, percentage: 0 },
      fats: { consumed: 0, goal: 0, percentage: 0 },
      foods: [] as any[]
    },
    dinner: {
      calories: { consumed: 0, goal: 0, percentage: 0 },
      carbs: { consumed: 0, goal: 0, percentage: 0 },
      proteins: { consumed: 0, goal: 0, percentage: 0 },
      fats: { consumed: 0, goal: 0, percentage: 0 },
      foods: [] as any[]
    }
  };

  // Getter per progress bar separate (calorie consumate e bruciate)
  get consumedCaloriesProgressOffset(): number {
    const percentage = Math.min(100, (this.dailyStats.calories.consumed / this.dailyStats.calories.adjustedGoal) * 100);
    const circumference = 377.0; // circonferenza del semicerchio più grande (raggio 120)
    return circumference - (circumference * percentage / 100);
  }

  get burnedCaloriesProgressOffset(): number {
    const percentage = Math.min(100, (this.dailyStats.calories.burned / this.dailyStats.calories.adjustedGoal) * 100);
    const circumference = 267.0; // circonferenza del semicerchio (raggio 85)
    return circumference - (circumference * percentage / 100);
  }

  constructor(
    // Commentiamo temporaneamente questi servizi
    // private authService: AuthService,
    // private apiService: ApiService,
    private deviceService: DeviceService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router
  ) {
    addIcons({personOutline,nutritionOutline,chevronBackOutline,chevronForwardOutline,fitnessOutline,restaurantOutline,waterOutline,trendingUpOutline,cafeOutline,addOutline,pizzaOutline,moonOutline,flameOutline,wineOutline,fastFoodOutline,timeOutline,checkmarkCircleOutline,alertCircleOutline,statsChartOutline,refreshOutline,scanOutline,calendarOutline});
  }

  ngOnInit() {
    this.initializeDeviceDetection();
    this.loadUserData();
    this.updateNutritionGoals(); // Calcola obiettivi nutrizionali
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initializeDeviceDetection() {
    // Sottoscrivi ai cambiamenti del dispositivo
    this.subscriptions.add(
      this.deviceService.deviceInfo$.subscribe(deviceInfo => {
        this.isDesktop = deviceInfo.isDesktop;
        this.isTablet = deviceInfo.isTablet;
        this.isMobile = deviceInfo.isMobile;
        this.deviceLayout = this.deviceService.getOptimalLayout();
        
        // Aggiorna il layout del dashboard in base al dispositivo
        this.updateLayoutForDevice();
      })
    );
  }

  private updateLayoutForDevice() {
    // Aggiorna le azioni rapide in base al dispositivo
    if (this.isDesktop) {
      this.quickActions = [
        { icon: 'cafe-outline', label: 'Aggiungi Colazione', action: 'addMeal', color: 'warning' },
        { icon: 'restaurant-outline', label: 'Aggiungi Pranzo', action: 'addMeal', color: 'success' },
        { icon: 'cafe-outline', label: 'Aggiungi Cena', action: 'addMeal', color: 'tertiary' },
        { icon: 'nutrition-outline', label: 'Aggiungi Spuntino', action: 'addMeal', color: 'medium' },
        { icon: 'water-outline', label: 'Registra Acqua', action: 'addWater', color: 'primary' },
        { icon: 'trending-up-outline', label: 'Registra Attività', action: 'addActivity', color: 'secondary' }
      ];
    } else {
      this.quickActions = [
        { icon: 'cafe-outline', label: 'Colazione', action: 'addMeal', color: 'warning' },
        { icon: 'restaurant-outline', label: 'Pranzo', action: 'addMeal', color: 'success' },
        { icon: 'water-outline', label: 'Acqua', action: 'addWater', color: 'primary' },
        { icon: 'trending-up-outline', label: 'Attività', action: 'addActivity', color: 'tertiary' }
      ];
    }
  }

  // Metodi per calcoli nutrizionali
  private calculateBMR(): number {
    const { age, weight, height, gender } = this.dailyStats.userProfile;
    
    if (gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  }

  private calculateTDEE(): number {
    const bmr = this.calculateBMR();
    const activityFactor = this.activityFactors[this.dailyStats.userProfile.activityLevel];
    return Math.round(bmr * activityFactor);
  }

  private updateNutritionGoals() {
    // Calcola TDEE (Total Daily Energy Expenditure)
    const tdee = this.calculateTDEE();
    
    // Aggiusta per l'obiettivo dell'utente
    let calorieGoal = tdee;
    switch (this.dailyStats.userProfile.goal) {
      case 'lose_weight':
        calorieGoal = tdee - 500; // Deficit di 500 kcal per perdere ~0.5kg/settimana
        break;
      case 'gain_weight':
        calorieGoal = tdee + 500; // Surplus di 500 kcal
        break;
      case 'gain_muscle':
        calorieGoal = tdee + 300; // Surplus più moderato
        break;
      default:
        calorieGoal = tdee; // Mantenimento
    }

    // Aggiorna goal calorico
    this.dailyStats.calories.goal = calorieGoal;
    this.dailyStats.calories.adjustedGoal = calorieGoal + this.dailyStats.calories.burned;

    // Calcola macronutrienti basati sulla distribuzione dell'obiettivo
    const distribution = this.macroDistributions[this.dailyStats.userProfile.goal];
    
    // Proteine: 4 kcal/g, Carboidrati: 4 kcal/g, Grassi: 9 kcal/g
    this.dailyStats.proteins.goal = Math.round((calorieGoal * distribution.proteins) / 4);
    this.dailyStats.carbs.goal = Math.round((calorieGoal * distribution.carbs) / 4);
    this.dailyStats.fats.goal = Math.round((calorieGoal * distribution.fats) / 9);

    // Calcola obiettivi per ogni pasto
    this.updateMealGoals();

    // Calcola percentuali
    this.updateNutritionPercentages();
  }

  private updateMealGoals() {
    // Calcola obiettivi per ogni pasto basati sulla distribuzione
    const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
    
    mealTypes.forEach(mealType => {
      const distribution = this.mealDistribution[mealType];
      
      // Calcola obiettivi per questo pasto
      this.mealStats[mealType].calories.goal = Math.round(this.dailyStats.calories.goal * distribution.calories);
      this.mealStats[mealType].carbs.goal = Math.round(this.dailyStats.carbs.goal * distribution.carbs);
      this.mealStats[mealType].proteins.goal = Math.round(this.dailyStats.proteins.goal * distribution.proteins);
      this.mealStats[mealType].fats.goal = Math.round(this.dailyStats.fats.goal * distribution.fats);
      
      // Calcola percentuali (consumed/goal)
      this.updateMealPercentages(mealType);
    });
  }

  private updateMealPercentages(mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner') {
    const meal = this.mealStats[mealType];
    
    meal.calories.percentage = meal.calories.goal > 0 ? Math.round((meal.calories.consumed / meal.calories.goal) * 100) : 0;
    meal.carbs.percentage = meal.carbs.goal > 0 ? Math.round((meal.carbs.consumed / meal.carbs.goal) * 100) : 0;
    meal.proteins.percentage = meal.proteins.goal > 0 ? Math.round((meal.proteins.consumed / meal.proteins.goal) * 100) : 0;
    meal.fats.percentage = meal.fats.goal > 0 ? Math.round((meal.fats.consumed / meal.fats.goal) * 100) : 0;
  }

  private updateNutritionPercentages() {
    this.dailyStats.calories.percentage = Math.round((this.dailyStats.calories.consumed / this.dailyStats.calories.adjustedGoal) * 100);
    this.dailyStats.calories.remaining = this.dailyStats.calories.adjustedGoal - this.dailyStats.calories.consumed;
    
    this.dailyStats.proteins.percentage = Math.round((this.dailyStats.proteins.consumed / this.dailyStats.proteins.goal) * 100);
    this.dailyStats.carbs.percentage = Math.round((this.dailyStats.carbs.consumed / this.dailyStats.carbs.goal) * 100);
    this.dailyStats.fats.percentage = Math.round((this.dailyStats.fats.consumed / this.dailyStats.fats.goal) * 100);
  }

  private loadUserData() {
    // Simuliamo un utente per ora
    this.user = {
      id: 1,
      name: 'Demo User',
      email: 'demo@nutrijournal.com',
      birth_date: '1990-01-01',
      gender: 'male',
      height: 175,
      weight: 70,
      activity_level: 'moderate',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      nutritionGoals: {
        daily_calories: 2000,
        daily_carbs: 250,
        daily_proteins: 150,
        daily_fats: 70,
        goal_type: 'maintain'
      }
    };
    this.updateNutritionGoals();
  }

  async loadDashboardData(event?: any) {
    try {
      if (!event) {
        this.isLoading = true;
      }

      // Simula dati per ora (fino a quando non connettiamo il backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Sostituire con chiamate API reali basate su this.currentDate
      // const formattedDate = this.currentDate.toISOString().split('T')[0];
      // await this.apiService.getDailyNutrition(formattedDate);
      
      // Per ora simuliamo dati diversi in base alla data per test
      const dayOffset = Math.floor((new Date().getTime() - this.currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      this.dailyStats.calories.consumed = Math.max(800, 1200 - (dayOffset * 100));
      this.dailyStats.carbs.consumed = Math.max(80, 150 - (dayOffset * 20));
      this.dailyStats.proteins.consumed = Math.max(50, 80 - (dayOffset * 10));
      this.dailyStats.fats.consumed = Math.max(30, 45 - (dayOffset * 5));
      this.dailyStats.water.consumed = Math.max(500, 1250 - (dayOffset * 150));
      this.dailyStats.activities = Math.max(0, 2 - Math.floor(dayOffset / 2));

      this.updateDailyStatsPercentages();

    } catch (error) {
      console.error('Errore nel caricamento dei dati dashboard:', error);
      this.showToast('Errore nel caricamento dei dati', 'danger');
    } finally {
      this.isLoading = false;
      if (event) {
        event.target.complete();
      }
    }
  }

  private updateDailyStatsPercentages() {
    this.dailyStats.calories.percentage = Math.min(
      (this.dailyStats.calories.consumed / this.dailyStats.calories.goal) * 100, 
      100
    );

    this.dailyStats.carbs.percentage = Math.min(
      (this.dailyStats.carbs.consumed / this.dailyStats.carbs.goal) * 100, 
      100
    );

    this.dailyStats.proteins.percentage = Math.min(
      (this.dailyStats.proteins.consumed / this.dailyStats.proteins.goal) * 100, 
      100
    );

    this.dailyStats.fats.percentage = Math.min(
      (this.dailyStats.fats.consumed / this.dailyStats.fats.goal) * 100, 
      100
    );
  }

  private updateDailyStats() {
    if (!this.todayNutrition) return;

    // Aggiorna calorie
    this.dailyStats.calories.consumed = Math.round(this.todayNutrition.totalCalories || 0);
    this.dailyStats.calories.percentage = Math.min(
      (this.dailyStats.calories.consumed / this.dailyStats.calories.goal) * 100, 
      100
    );

    // Aggiorna macronutrienti
    this.dailyStats.carbs.consumed = Math.round(this.todayNutrition.totalCarbohydrates || 0);
    this.dailyStats.carbs.percentage = Math.min(
      (this.dailyStats.carbs.consumed / this.dailyStats.carbs.goal) * 100, 
      100
    );

    this.dailyStats.proteins.consumed = Math.round(this.todayNutrition.totalProteins || 0);
    this.dailyStats.proteins.percentage = Math.min(
      (this.dailyStats.proteins.consumed / this.dailyStats.proteins.goal) * 100, 
      100
    );

    this.dailyStats.fats.consumed = Math.round(this.todayNutrition.totalFats || 0);
    this.dailyStats.fats.percentage = Math.min(
      (this.dailyStats.fats.consumed / this.dailyStats.fats.goal) * 100, 
      100
    );
  }

  // Metodi per gestire calorie bruciate
  addBurnedCalories(calories: number) {
    this.dailyStats.calories.burned += calories;
    this.dailyStats.calories.adjustedGoal = this.dailyStats.calories.goal + this.dailyStats.calories.burned;
    this.updateNutritionPercentages();
  }

  // Helper per colori progress bar
  getProgressColor(percentage: number): string {
    if (percentage < 50) return 'danger';
    if (percentage < 80) return 'warning';
    if (percentage <= 100) return 'success';
    return 'tertiary'; // Over target
  }

  // Helper per circular progress
  getCircularProgressColor(percentage: number): string {
    if (percentage < 70) return '#ff4444'; // Rosso
    if (percentage < 90) return '#ffaa00'; // Arancione  
    if (percentage <= 100) return '#00dd00'; // Verde
    return '#6600cc'; // Viola per over target
  }

  // Helper per Math.abs nel template
  getMathAbs(value: number): number {
    return Math.abs(value);
  }

  async handleQuickAction(action: any) {
    if (action.action === 'addWater') {
      await this.addWater();
    } else if (action.action === 'addMeal') {
      this.showToast('Funzionalità in arrivo!', 'primary');
    } else if (action.action === 'addActivity') {
      this.showToast('Funzionalità in arrivo!', 'primary');
    } else if (action.action === 'openScanner') {
      this.openScanner();
    }
  }

  async addWater() {
    this.dailyStats.water.consumed += 250; // Aggiungi 250ml
    this.showToast('250ml di acqua aggiunti!', 'success');
    
    // TODO: Salvare nel backend
  }

  openScanner() {
    this.router.navigate(['/scanner']);
  }

  openUserProfile() {
    // TODO: Implementare navigazione al profilo utente
    this.router.navigate(['/profile']);
  }

  // Metodi per la navigazione temporale
  goToPreviousDay() {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() - 1);
    this.currentDate = newDate;
    this.loadDashboardData();
  }

  goToNextDay() {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + 1);
    
    // Non permettere di andare oltre oggi
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (newDate <= today) {
      this.currentDate = newDate;
      this.loadDashboardData();
    }
  }

  goToToday() {
    this.currentDate = new Date();
    this.loadDashboardData();
  }

  // Metodi helper per la visualizzazione date
  getDateDisplayText(): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (this.isSameDay(this.currentDate, today)) {
      return 'Oggi';
    } else if (this.isSameDay(this.currentDate, yesterday)) {
      return 'Ieri';
    } else {
      return this.currentDate.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  isToday(): boolean {
    return this.isSameDay(this.currentDate, new Date());
  }

  canGoToNextDay(): boolean {
    const tomorrow = new Date(this.currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const today = new Date();
    return tomorrow <= today;
  }

  addMeal(mealType: string) {
    // Converti il mealType dal formato inglese a quello italiano
    let italianMealType: string;
    
    switch (mealType) {
      case 'breakfast':
        italianMealType = 'Colazione';
        break;
      case 'lunch':
        italianMealType = 'Pranzo';
        break;
      case 'snack':
        italianMealType = 'Spuntini';
        break;
      case 'dinner':
        italianMealType = 'Cena';
        break;
      default:
        italianMealType = 'Colazione';
    }
    
    // Naviga alla pagina di aggiunta pasto con parametri
    this.router.navigate(['/meal/add'], {
      queryParams: {
        type: italianMealType,
        date: new Date().toISOString().split('T')[0] // Data corrente
      }
    });
  }

  // Metodo helper per ottenere i dati di un pasto specifico
  getMealStats(mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner') {
    return this.mealStats[mealType];
  }

  /**
   * Apre la pagina di aggiunta pasto generale senza tipo preselezionato
   */
  openGeneralMealAdd() {
    this.router.navigate(['/meal/add'], {
      queryParams: {
        date: new Date().toISOString().split('T')[0] // Data corrente
      }
    });
  }

  // Metodo helper per ottenere l'icona del pasto
  getMealIcon(mealType: string): string {
    switch (mealType) {
      case 'breakfast': return 'cafe-outline';
      case 'lunch': return 'restaurant-outline';
      case 'snack': return 'pizza-outline';
      case 'dinner': return 'moon-outline';
      default: return 'restaurant-outline';
    }
  }

  // Metodo helper per ottenere il nome italiano del pasto
  getMealName(mealType: string): string {
    switch (mealType) {
      case 'breakfast': return 'Colazione';
      case 'lunch': return 'Pranzo';
      case 'snack': return 'Spuntino';
      case 'dinner': return 'Cena';
      default: return mealType;
    }
  }

  getWelcomeMessage(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Formattazione data per display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
