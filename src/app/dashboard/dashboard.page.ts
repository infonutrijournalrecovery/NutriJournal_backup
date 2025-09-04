import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NavController, ToastController, LoadingController, IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonBadge, IonProgressBar, IonFab, IonFabButton, IonFabList, IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton, IonInput,     IonModal,   IonDatetime} from '@ionic/angular/standalone';
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
  calendarOutline, wineOutline, fastFoodOutline, barcodeOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
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
    ReactiveFormsModule,
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
    IonSegmentButton,
    IonInput,
    IonModal,       // \U0001f448 AGGIUNTO
    IonDatetime     // \U0001f448 AGGIUNTO
  ]
})



export class DashboardPage implements OnInit, OnDestroy {
  user: User | null = null;
  todayNutrition: DailyNutrition | null = null;
  recentMeals: Meal[] = [];
  recentActivities: Activity[] = [];
  isLoading = false;
  selectedSegment = 'nutrition';
  waterForm: FormGroup;
  currentDate = new Date();
  isDesktop = false;
  isTablet = false;
  isMobile = true;
  deviceLayout: 'mobile' | 'tablet' | 'desktop' = 'mobile';
  private subscriptions = new Subscription();

  selectedDate: string = new Date().toISOString();
  isDatePickerOpen = false;

  /** Torna alla data di oggi */
  goToToday() {
    this.selectedDate = new Date().toISOString();
  }

  /** Torna al giorno precedente */
  goToPreviousDay() {
    const current = new Date(this.selectedDate);
    current.setDate(current.getDate() - 1);
    this.selectedDate = current.toISOString();
  }

  /** Vai al giorno successivo */
  goToNextDay() {
    const current = new Date(this.selectedDate);
    current.setDate(current.getDate() + 1);
    this.selectedDate = current.toISOString();
  }

  /** Controlla se la data selezionata � oggi */
  isToday(): boolean {
    const today = new Date();
    const current = new Date(this.selectedDate);
    return (
      today.getDate() === current.getDate() &&
      today.getMonth() === current.getMonth() &&
      today.getFullYear() === current.getFullYear()
    );
  }

  /** Disabilita il pulsante "avanti" se la data � oggi */
  canGoToNextDay(): boolean {
    return !this.isToday();
  }

  /** Apre il modal per la selezione della data */
  openDatePicker() {
    this.isDatePickerOpen = true;
  }

  /** Chiude il modal */
  closeDatePicker() {
    this.isDatePickerOpen = false;
  }

  /** Quando l\u2019utente seleziona una nuova data dal calendario */
  onDateSelected(event: any) {
    if (event?.detail?.value) {
      this.selectedDate = event.detail.value;
    }
    this.closeDatePicker();
  }

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

  // Statistiche giornaliere
  dailyStats = {
    calories: { 
      consumed: 1847, 
      burned: 247, 
      goal: 2200, 
      adjustedGoal: 2447,
      percentage: 0,
      remaining: 0
    },
    carbs: { consumed: 203, goal: 275, percentage: 0 },
    proteins: { consumed: 87, goal: 110, percentage: 0 },
    fats: { consumed: 51, goal: 73, percentage: 0 },
    water: { consumed: 1250, goal: 2000, percentage: 0 },
    activities: 3,
    userProfile: {
      age: 30,
      weight: 70,
      height: 175,
      gender: 'male' as 'male' | 'female',
      activityLevel: 'moderately_active' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active',
      goal: 'maintain' as 'lose_weight' | 'maintain' | 'gain_weight' | 'gain_muscle'
    }
  };

  // Quick actions
  quickActions = [
    { icon: 'cafe-outline', label: 'Colazione', action: 'addMeal', color: 'warning' },
    { icon: 'restaurant-outline', label: 'Pranzo', action: 'addMeal', color: 'success' },
    { icon: 'scan-outline', label: 'Scanner', action: 'openScanner', color: 'secondary' },
    { icon: 'water-outline', label: 'Acqua', action: 'addWater', color: 'primary' },
    { icon: 'trending-up-outline', label: 'Attività', action: 'addActivity', color: 'tertiary' }
  ];

  // Distribuzione pasti
  mealDistribution = {
    breakfast: { calories: 0.25, carbs: 0.30, proteins: 0.20, fats: 0.20 },
    lunch: { calories: 0.35, carbs: 0.40, proteins: 0.35, fats: 0.35 },
    snack: { calories: 0.15, carbs: 0.15, proteins: 0.15, fats: 0.15 },
    dinner: { calories: 0.25, carbs: 0.15, proteins: 0.30, fats: 0.30 }
  };

  // Fattori attività
  private activityFactors = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  };

  // Distribuzioni macronutrienti
  private macroDistributions = {
    lose_weight: { carbs: 0.4, proteins: 0.3, fats: 0.3 },
    maintain: { carbs: 0.5, proteins: 0.2, fats: 0.3 },
    gain_weight: { carbs: 0.55, proteins: 0.25, fats: 0.2 },
    gain_muscle: { carbs: 0.45, proteins: 0.3, fats: 0.25 }
  };

  constructor(
    private deviceService: DeviceService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router,
    private navCtrl: NavController,
    private fb: FormBuilder
  ) {
    this.waterForm = this.fb.group({
      waterAmount: [0]
    });

    addIcons({
      personOutline,
      nutritionOutline,
      chevronBackOutline,
      chevronForwardOutline,
      fitnessOutline,
      restaurantOutline,
      waterOutline,
      trendingUpOutline,
      cafeOutline,
      addOutline,
      pizzaOutline,
      moonOutline,
      barcodeOutline,
      fastFoodOutline,
      flameOutline,
      wineOutline,
      timeOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      statsChartOutline,
      refreshOutline,
      scanOutline,
      calendarOutline,
      checkmarkCircle: checkmarkCircleOutline,
      alertCircle: alertCircleOutline
    });
  }

  ngOnInit() {
    this.initializeDeviceDetection();
    this.loadUserData();
    this.updateNutritionGoals();
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Form Control Getters
  get waterAmount() {
    return this.waterForm.get('waterAmount') as FormControl;
  }

  // Progress Getters
  get consumedCaloriesProgressOffset(): number {
    const percentage = Math.min(100, (this.dailyStats.calories.consumed / this.dailyStats.calories.adjustedGoal) * 100);
    const circumference = 377.0;
    return circumference - (circumference * percentage / 100);
  }

  get burnedCaloriesProgressOffset(): number {
    const percentage = Math.min(100, (this.dailyStats.calories.burned / this.dailyStats.calories.adjustedGoal) * 100);
    const circumference = 267.0;
    return circumference - (circumference * percentage / 100);
  }

  // Device Detection
  private initializeDeviceDetection() {
    console.log('Initializing device detection');
    this.subscriptions.add(
      this.deviceService.deviceInfo$.subscribe(deviceInfo => {
        console.log('Device info updated:', deviceInfo);
        this.isDesktop = deviceInfo.isDesktop;
        this.isTablet = deviceInfo.isTablet;
        this.isMobile = deviceInfo.isMobile;
        this.deviceLayout = this.deviceService.getOptimalLayout();
        this.updateLayoutForDevice();
      })
    );
  }

  // Navigation Methods
  async goToActivity() {
    try {
      console.log('Navigating to activity/add');
      await this.navCtrl.navigateForward('/tabs/activity/add');
    } catch (error) {
      console.error('Error navigating to activity:', error);
      await this.showToast('Errore durante la navigazione', 'danger');
    }
  }

  async addMeal(type: string) {
    try {
      console.log('Navigating to meal/add with type:', type);
      const mealTypes: { [key: string]: string } = {
        'breakfast': 'Colazione',
        'lunch': 'Pranzo',
        'snack': 'Spuntini',
        'dinner': 'Cena',
        'colazione': 'Colazione',
        'pranzo': 'Pranzo',
        'spuntino': 'Spuntini',
        'cena': 'Cena'
      };
      
      const italianMealType = mealTypes[type.toLowerCase()] || 'Colazione';
      console.log('Mapped meal type:', italianMealType);
      
      await this.navCtrl.navigateForward('/tabs/meal/add', {
        queryParams: {
          type: italianMealType,
          date: this.currentDate.toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error('Error navigating to meal/add:', error);
      await this.showToast('Errore durante la navigazione', 'danger');
    }
  }

  // Layout Methods
  private updateLayoutForDevice() {
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

  // Nutrition Calculation Methods
  private calculateBMR(): number {
    const { age, weight, height, gender } = this.dailyStats.userProfile;
    return gender === 'male'
      ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
      : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  private calculateTDEE(): number {
    const bmr = this.calculateBMR();
    const activityFactor = this.activityFactors[this.dailyStats.userProfile.activityLevel];
    return Math.round(bmr * activityFactor);
  }

  private updateNutritionGoals() {
    const tdee = this.calculateTDEE();
    let calorieGoal = tdee;
    
    switch (this.dailyStats.userProfile.goal) {
      case 'lose_weight': calorieGoal = tdee - 500; break;
      case 'gain_weight': calorieGoal = tdee + 500; break;
      case 'gain_muscle': calorieGoal = tdee + 300; break;
    }

    this.dailyStats.calories.goal = calorieGoal;
    this.dailyStats.calories.adjustedGoal = calorieGoal + this.dailyStats.calories.burned;

    const distribution = this.macroDistributions[this.dailyStats.userProfile.goal];
    this.dailyStats.proteins.goal = Math.round((calorieGoal * distribution.proteins) / 4);
    this.dailyStats.carbs.goal = Math.round((calorieGoal * distribution.carbs) / 4);
    this.dailyStats.fats.goal = Math.round((calorieGoal * distribution.fats) / 9);

    this.updateMealGoals();
    this.updateNutritionPercentages();
  }

  // Data Loading Methods
  private loadUserData() {
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

      await new Promise(resolve => setTimeout(resolve, 1000));
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
      await this.showToast('Errore nel caricamento dei dati', 'danger');
    } finally {
      this.isLoading = false;
      if (event) {
        event.target.complete();
      }
    }
  }

  // Helper Methods
  getMealIcon(mealType: string): string {
    switch (mealType) {
      case 'breakfast': return 'cafe-outline';
      case 'lunch': return 'restaurant-outline';
      case 'snack': return 'pizza-outline';
      case 'dinner': return 'moon-outline';
      default: return 'restaurant-outline';
    }
  }

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

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

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

  // Water Methods
  confirmWater() {
    const amount = this.waterForm.get('waterAmount')?.value || 0;
    console.log("Acqua bevuta:", amount, "ml");
    this.dailyStats.water.consumed += amount;
    this.waterForm.get('waterAmount')?.setValue(0);
    this.showToast(`${amount}ml di acqua aggiunti!`, 'success');
  }

  async addWater() {
    this.dailyStats.water.consumed += 250;
    await this.showToast('250ml di acqua aggiunti!', 'success');
  }

  // Navigation Methods
  async openScanner() {
    try {
      await this.navCtrl.navigateForward('/tabs/scanner');
    } catch (error) {
      console.error('Error navigating to scanner:', error);
      await this.showToast('Errore durante la navigazione', 'danger');
    }
  }

  openUserProfile() {
    this.router.navigate(['/profile']);
  }

  // Time Navigation Methods
  /* goToPreviousDay() {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() - 1);
    this.currentDate = newDate;
    this.loadDashboardData();
  }

  goToNextDay() {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + 1);
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
  } */

  // Date Helper Methods
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
/*
  isToday(): boolean {
    return this.isSameDay(this.currentDate, new Date());
  }

  canGoToNextDay(): boolean {
    const tomorrow = new Date(this.currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const today = new Date();
    return tomorrow <= today;
  }
*/
  // Quick Actions Handler
  async handleQuickAction(action: any) {
    try {
      if (action.action === 'addWater') {
        await this.addWater();
      } else if (action.action === 'addMeal') {
        const mealType = action.label.replace('Aggiungi ', '').toLowerCase();
        await this.addMeal(mealType);
      } else if (action.action === 'addActivity') {
        await this.goToActivity();
      } else if (action.action === 'openScanner') {
        await this.router.navigate(['/tabs/scanner']);
      }
    } catch (error) {
      console.error('Errore durante l\'esecuzione dell\'azione:', error);
      await this.showToast('Si è verificato un errore. Riprova.', 'danger');
    }
  }

  // Nutrition Update Methods
  private updateMealGoals() {
    const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
    
    mealTypes.forEach(mealType => {
      const distribution = this.mealDistribution[mealType];
      this.mealStats[mealType].calories.goal = Math.round(this.dailyStats.calories.goal * distribution.calories);
      this.mealStats[mealType].carbs.goal = Math.round(this.dailyStats.carbs.goal * distribution.carbs);
      this.mealStats[mealType].proteins.goal = Math.round(this.dailyStats.proteins.goal * distribution.proteins);
      this.mealStats[mealType].fats.goal = Math.round(this.dailyStats.fats.goal * distribution.fats);
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

  // Stats Methods
  addBurnedCalories(calories: number) {
    this.dailyStats.calories.burned += calories;
    this.dailyStats.calories.adjustedGoal = this.dailyStats.calories.goal + this.dailyStats.calories.burned;
    this.updateNutritionPercentages();
  }

  getProgressColor(percentage: number): string {
    if (percentage < 50) return 'danger';
    if (percentage < 80) return 'warning';
    if (percentage <= 100) return 'success';
    return 'tertiary';
  }

  getCircularProgressColor(percentage: number): string {
    if (percentage < 70) return '#ff4444';
    if (percentage < 90) return '#ffaa00';
    if (percentage <= 100) return '#00dd00';
    return '#6600cc';
  }

  getMathAbs(value: number): number {
    return Math.abs(value);
  }

  getMealStats(mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner') {
    return this.mealStats[mealType];
  }

  async openGeneralMealAdd() {
    try {
      await this.navCtrl.navigateForward('/tabs/meal/add', {
        queryParams: {
          date: this.currentDate.toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error('Error navigating to meal/add:', error);
      await this.showToast('Errore durante la navigazione', 'danger');
    }
  }
}