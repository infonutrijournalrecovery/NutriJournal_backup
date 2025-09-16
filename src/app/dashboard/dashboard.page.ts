import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NavController, ToastController, LoadingController, ModalController, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonProgressBar, IonFab, IonFabButton, IonFabList, IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton, IonInput, IonList } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline,
  cafeOutline,
  trendingUpOutline,
  waterOutline,
  flameOutline,
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
  calendarOutline, wineOutline, fastFoodOutline, barcodeOutline, scaleOutline, trashOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { DeviceService } from '../shared/services/device.service';
import { User, DailyNutrition, Meal } from '../shared/interfaces/types';
import { Activity } from '../shared/interfaces/Activity.interface';
import { ApiService } from '../shared/services/api.service';
import { AuthService } from '../shared/services/auth.service';
import { EventBusService } from '../shared/services/event-bus.service';

import { DatePickerModalComponent } from '../shared/components/date-picker-modal.component';


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
  IonItem,
  IonLabel,
  IonProgressBar,
  IonInput,
  IonList,
  ],
  providers: []
})

export class DashboardPage implements OnInit, OnDestroy {
  /** Pasti raggruppati per tipo, usati per la visualizzazione diretta dei prodotti */
  public mealsByDateGrouped: { [key: string]: any[] } = {
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: []
  };

  /** Restituisce la label italiana per il tipo di attività */
  getActivityLabel(type: string): string {
    const map: { [key: string]: string } = {
      // Italiano
      'Camminata': 'Camminata',
      'Corsa': 'Corsa',
      'Ciclismo': 'Ciclismo',
      'Corpo libero': 'Corpo libero',
      'Pallavolo': 'Pallavolo',
      // Inglese comuni
      'Walking': 'Camminata',
      'Run': 'Corsa',
      'Running': 'Corsa',
      'Cycling': 'Ciclismo',
      'Swim': 'Nuoto',
      'Swimming': 'Nuoto',
      'Gym': 'Palestra',
      'Bodyweight': 'Corpo libero',
      'Weightlifting': 'Sollevamento pesi',
      'Yoga': 'Yoga',
      'Stretching': 'Stretching',
      'Pilates': 'Pilates',
      'Football': 'Calcio',
      'Soccer': 'Calcio',
      'Basketball': 'Basket',
      'Tennis': 'Tennis',
      'Volleyball': 'Pallavolo',
    };
    return map[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : 'Attività');
  }

    activitiesToday: Activity[] = [];
    user: User | null = null;
    todayNutrition: DailyNutrition | null = null;
    recentMeals: Meal[] = [];
    recentActivities: Activity[] = [];
    isLoading = false;
    selectedSegment: 'nutrition' | 'activity' = 'nutrition';

    isActivitySegment(): boolean {
      return this.selectedSegment === 'activity';
    }
    waterForm: FormGroup;
    weightForm: FormGroup;
    currentDate = new Date();
    isDesktop = false;
    isTablet = false;
    isMobile = true;
    deviceLayout: 'mobile' | 'tablet' | 'desktop' = 'mobile';
    private subscriptions = new Subscription();


    /** Torna alla data di oggi */
    goToToday() {
      this.currentDate = new Date();
      this.loadDashboardData();
    }

    /** Torna al giorno precedente */
    goToPreviousDay() {
      const prev = new Date(this.currentDate);
      prev.setDate(prev.getDate() - 1);
      this.currentDate = prev;
      this.loadDashboardData();
    }

    /** Vai al giorno successivo */
    goToNextDay() {
      const next = new Date(this.currentDate);
      next.setDate(next.getDate() + 1);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (next <= today) {
        this.currentDate = next;
        this.loadDashboardData();
      }
    }

    /** Controlla se la data selezionata è oggi */
    isToday(): boolean {
      const today = new Date();
      return (
        today.getDate() === this.currentDate.getDate() &&
        today.getMonth() === this.currentDate.getMonth() &&
        today.getFullYear() === this.currentDate.getFullYear()
      );
    }

    async loadActivitiesForSelectedDate() {
      try {
        // Usa currentDate per il filtro
        const dateStr = this.currentDate.getFullYear() + '-' + String(this.currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(this.currentDate.getDate()).padStart(2, '0');
        const res = await this.apiService.getActivities(1, 50).toPromise();
        console.log('[DEBUG] Risposta completa getActivities:', res);
        let activitiesArr = res?.data?.activities || [];
        if (activitiesArr && Array.isArray(activitiesArr)) {
          console.log('[DEBUG] Attività trovate:', activitiesArr);
          this.activitiesToday = (activitiesArr as Activity[]).filter((a: Activity) => {
            if (!a.date) return false;
            const d = new Date(a.date);
            const activityDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            const match = activityDate === dateStr;
            if (!match) return false;
            // Log dettagliato per debug dati corrotti
            console.log('[DEBUG][ACTIVITY]', a);
            return true;
          });
          console.log('[DEBUG] activitiesToday:', this.activitiesToday);
          this.recentActivities = this.activitiesToday.slice(0, 5);
          this.dailyStats.calories.burned = this.activitiesToday.reduce((sum, a) => sum + (a.calories_burned || 0), 0);
        } else {
          this.activitiesToday = [];
          this.recentActivities = [];
          this.dailyStats.calories.burned = 0;
        }
      } catch (err) {
        this.activitiesToday = [];
        this.recentActivities = [];
        this.dailyStats.calories.burned = 0;
      }
    }


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

    /**
     * Placeholder azzerato: i valori reali vengono caricati dinamicamente.
     */
    dailyStats = {
      calories: { 
        consumed: 0, 
        burned: 0, 
        goal: 0, 
        adjustedGoal: 0,
        percentage: 0,
        remaining: 0
      },
      carbs: { consumed: 0, goal: 0, percentage: 0 },
      proteins: { consumed: 0, goal: 0, percentage: 0 },
      fats: { consumed: 0, goal: 0, percentage: 0 },
      water: { consumed: 0, goal: 0, percentage: 0 },
      activities: 0,
      userProfile: {
        age: 0,
        weight: 0,
        height: 0,
        gender: 'male' as 'male' | 'female',
        activityLevel: 'sedentary' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active',
        goal: 'maintain' as 'lose_weight' | 'maintain' | 'gain_weight' | 'gain_muscle'
      }
    };

    quickActions = [
      { icon: 'cafe-outline', label: 'Colazione', action: 'addMeal', color: 'warning' },
      { icon: 'restaurant-outline', label: 'Pranzo', action: 'addMeal', color: 'success' },
      { icon: 'scan-outline', label: 'Scanner', action: 'openScanner', color: 'secondary' },
      { icon: 'water-outline', label: 'Acqua', action: 'addWater', color: 'primary' },
      { icon: 'trending-up-outline', label: 'Attività', action: 'addActivity', color: 'tertiary' }
    ];

    mealDistribution = {
      breakfast: { calories: 0.25, carbs: 0.30, proteins: 0.20, fats: 0.20 },
      lunch: { calories: 0.35, carbs: 0.40, proteins: 0.35, fats: 0.35 },
      snack: { calories: 0.15, carbs: 0.15, proteins: 0.15, fats: 0.15 },
      dinner: { calories: 0.25, carbs: 0.15, proteins: 0.30, fats: 0.30 }
    };

    private activityFactors = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9
    };

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
      private fb: FormBuilder,
      private apiService: ApiService,
      private authService: AuthService,
      private eventBus: EventBusService,
      private modalController: ModalController,
      private cdr: ChangeDetectorRef
    ) {
      this.waterForm = this.fb.group({
        waterAmount: [0]
      });
      this.weightForm = this.fb.group({
        weightAmount: [0]
      });
  addIcons({personOutline,chevronBackOutline,calendarOutline,chevronForwardOutline,nutritionOutline,fitnessOutline,restaurantOutline,waterOutline,trendingUpOutline,trashOutline,addOutline,barcodeOutline,fastFoodOutline,statsChartOutline,scaleOutline,cafeOutline,pizzaOutline,moonOutline,flameOutline,wineOutline,checkmarkCircleOutline,alertCircleOutline,refreshOutline,scanOutline,checkmarkCircle:checkmarkCircleOutline,alertCircle:alertCircleOutline});
  }

  async openDatePicker() {
    const modal = await this.modalController.create({
      component: DatePickerModalComponent,
      componentProps: {
        date: this.currentDate.toISOString(),
        max: new Date().toISOString()
      },
      cssClass: 'date-picker-modal'
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.currentDate = new Date(data);
      this.loadDashboardData();
    }
  }


  ngOnInit() {
    this.initializeDeviceDetection();
    this.loadUserData();
    this.updateNutritionGoals();
    this.loadDashboardData();
    // Aggiornamento dinamico: ascolta eventi globali
    this.subscriptions.add(
      this.eventBus.dataUpdated$.subscribe(type => {
        // Aggiorna sempre tutto per semplicità
        this.loadDashboardData();
      })
    );
  }



  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Form Control Getters
  get waterAmount() {
    return this.waterForm.get('waterAmount') as FormControl;
  }

  get weightAmount() {
    return this.weightForm.get('weightAmount') as FormControl;
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
      console.log('Navigating to activity/add with date:', this.currentDate.toISOString().split('T')[0]);
      await this.navCtrl.navigateForward('/tabs/activity/add', {
        queryParams: {
          date: this.currentDate.toISOString().split('T')[0]
        }
      });
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
        { icon: 'cafe-outline', label: 'Colazione', action: 'addMeal', color: 'warning' },
        // ...altre azioni qui se necessario...
      ];
    }
  }

  private updateNutritionGoals() {
    if (!this.user) return;
    // 1. Calcolo BMR (Harris-Benedict)
    const gender = this.user.gender || 'male';
    const weight = this.user.weight ?? 70;
    const height = this.user.height ?? 170;
    const birth_date = this.user.birth_date ?? '1990-01-01';
    const activity_level = this.user.activity_level ?? 'sedentary';
    const nutritionGoals = this.user.nutritionGoals;
    const age = this.getAgeFromBirthDate(birth_date);
    let bmr = 0;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    // 2. Fattore attività
    const activity = activity_level as keyof typeof this.activityFactors;
    const activityFactor = this.activityFactors[activity] || 1.2;
    let tdee = bmr * activityFactor;
    // 3. Modifica per obiettivo
    const userGoal = (nutritionGoals?.goal_type || 'maintain') as keyof typeof this.macroDistributions;
    let calorieGoal = tdee;
    if (userGoal === 'lose_weight') calorieGoal -= 400;
    if (userGoal === 'gain_weight' || userGoal === 'gain_muscle') calorieGoal += 300;
    calorieGoal = Math.round(calorieGoal);
    // 4. Macro distribuzione
    const macro = this.macroDistributions[userGoal] || this.macroDistributions['maintain'];
    const proteins = Math.round((calorieGoal * macro.proteins) / 4);
    const carbs = Math.round((calorieGoal * macro.carbs) / 4);
    const fats = Math.round((calorieGoal * macro.fats) / 9);
    // 5. Aggiorna dailyStats
    this.dailyStats.calories.goal = calorieGoal;
    this.dailyStats.calories.adjustedGoal = calorieGoal + (this.dailyStats.calories.burned || 0);
    this.dailyStats.carbs.goal = carbs;
    this.dailyStats.proteins.goal = proteins;
    this.dailyStats.fats.goal = fats;
    // Acqua: 35ml per kg peso
    this.dailyStats.water.goal = Math.round(weight * 35);
    this.updateMealGoals();
    this.updateNutritionPercentages();
  }

  private getAgeFromBirthDate(birthDate?: string): number {
    if (!birthDate) return 30;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  // Data Loading Methods
 async loadUserData(event?: any) {
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

  async loadDashboardData(event?: any) {
  const dateStr = this.currentDate.toISOString().split('T')[0];
  console.log('[DEBUG][DASHBOARD] Data usata per getMealsByDateGrouped:', dateStr);
  
    // Carica acqua
    try {
      const waterRes: any = await this.apiService.getWater(dateStr).toPromise();
      this.dailyStats.water.consumed = (waterRes && typeof waterRes.amount === 'number') ? waterRes.amount : 0;
    } catch {
      this.dailyStats.water.consumed = 0;
    }
  
    if (!event) this.isLoading = true;
  
    try {
      // Carica i pasti raggruppati per tipo
      const mealsRes: any = await this.apiService.getMealsByDateGrouped(dateStr).toPromise();
      console.log('[DEBUG][Dashboard] Risposta grezza getMealsByDateGrouped:', mealsRes);

      // Salva direttamente per il template
        console.log('[DEBUG][DASHBOARD] Risposta API getMealsByDateGrouped:', mealsRes);
      console.log('[DEBUG][DASHBOARD] mealsRes:', mealsRes);
      console.log('[DEBUG][DASHBOARD] mealsRes.data:', mealsRes?.data);
      console.log('[DEBUG][DASHBOARD] mealsRes.data.mealsByType:', mealsRes?.data?.mealsByType);
      this.mealsByDateGrouped = mealsRes?.mealsByType || {
        breakfast: [],
        lunch: [],
        snack: [],
        dinner: []
      };
      console.log('[DEBUG][DASHBOARD] mealsByDateGrouped dopo assegnazione:', this.mealsByDateGrouped);
      if (this.mealsByDateGrouped && this.mealsByDateGrouped['breakfast']) {
        console.log('[DEBUG][DASHBOARD] Dettaglio breakfast:', JSON.stringify(this.mealsByDateGrouped['breakfast'], null, 2));
      }
      this.cdr.detectChanges();

      // DEBUG: stampa ogni pasto e i suoi items
      Object.keys(this.mealsByDateGrouped).forEach(type => {
        this.mealsByDateGrouped[type].forEach(meal => {
          console.log(`[DEBUG][Dashboard] tipo ${type} pasto ${meal.id}: items`, meal.items);
        });
      });

      // RIMOSSA logica foods: ora tutta la visualizzazione e i calcoli devono usare solo mealsByDateGrouped
  
      // Aggiorna statistiche giornaliere totali
  const allMeals: any[] = ([] as any[]).concat(...Object.values(this.mealsByDateGrouped));
      this.dailyStats.calories.consumed = allMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
      this.dailyStats.carbs.consumed = allMeals.reduce((sum, m) => sum + (m.total_carbs || 0), 0);
      this.dailyStats.proteins.consumed = allMeals.reduce((sum, m) => sum + (m.total_proteins || 0), 0);
      this.dailyStats.fats.consumed = allMeals.reduce((sum, m) => sum + (m.total_fats || 0), 0);
  
      this.updateDailyStatsPercentages();
  
      console.log('[DEBUG][Dashboard] mealStats popolato:', this.mealStats);
  
      // Carica attivit� della giornata
      await this.loadActivitiesForSelectedDate();
    } catch (error) {
      console.error('Errore nel caricamento dei dati dashboard:', error);
      await this.showToast('Errore nel caricamento dei dati', 'danger');
    } finally {
      this.isLoading = false;
      if (event) event.target.complete();
    }
  }

  // Struttura per i pasti raggruppati per tipo
  mealsByType: { [key: string]: any[] } = {
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: []
  };

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
    if (amount > 0) {
      const dateStr = this.currentDate.toISOString().split('T')[0];
      this.apiService.saveWater(dateStr, amount).subscribe({
        next: () => {
          this.dailyStats.water.consumed += amount;
          this.waterForm.get('waterAmount')?.setValue(0);
          this.showToast(`${amount}ml di acqua aggiunti!`, 'success');
        },
        error: () => {
          this.showToast('Errore salvataggio acqua', 'danger');
        }
      });
    }
  }

  confirmWeight() {
    const weight = this.weightForm.get('weightAmount')?.value;
    if (weight && weight > 0) {
      const dateStr = this.currentDate.toISOString().split('T')[0];
  
      this.apiService.saveWeight(dateStr, weight).subscribe({
        next: () => {
          // Aggiorna il dailyStats per la dashboard
          this.dailyStats.userProfile.weight = weight;
  
          // Aggiorna il currentUser tramite AuthService
          this.authService.updateCurrentUser({ weight });
  
          this.weightForm.get('weightAmount')?.setValue(0);
          this.showToast(`${weight} kg salvati correttamente`, 'success');
        },
        error: () => {
          this.showToast('Errore salvataggio peso', 'danger');
        }
      });
    }
  }

  async addWater() {
    const dateStr = this.currentDate.toISOString().split('T')[0];
    this.apiService.saveWater(dateStr, 250).subscribe({
      next: () => {
        this.dailyStats.water.consumed += 250;
        this.showToast('250ml di acqua aggiunti!', 'success');
      },
      error: () => {
        this.showToast('Errore salvataggio acqua', 'danger');
      }
    });
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
    // Calorie
    const calGoal = Math.max(this.dailyStats.calories.goal, 1);
    this.dailyStats.calories.percentage = Math.min((this.dailyStats.calories.consumed / calGoal) * 100, 100);
    // Carboidrati
    const carbGoal = Math.max(this.dailyStats.carbs.goal, 1);
    this.dailyStats.carbs.percentage = Math.min((this.dailyStats.carbs.consumed / carbGoal) * 100, 100);
    // Proteine
    const protGoal = Math.max(this.dailyStats.proteins.goal, 1);
    this.dailyStats.proteins.percentage = Math.min((this.dailyStats.proteins.consumed / protGoal) * 100, 100);
    // Grassi
    const fatGoal = Math.max(this.dailyStats.fats.goal, 1);
    this.dailyStats.fats.percentage = Math.min((this.dailyStats.fats.consumed / fatGoal) * 100, 100);
    // Acqua
    const waterGoal = Math.max(this.dailyStats.water.goal, 1);
    this.dailyStats.water.percentage = Math.min((this.dailyStats.water.consumed / waterGoal) * 100, 100);
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

  getMealStats(mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner' | string) {
    return this.mealStats[mealType as 'breakfast' | 'lunch' | 'snack' | 'dinner'];
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

  // Metodo per abilitare/disabilitare il pulsante "giorno successivo"
  canGoToNextDay(): boolean {
    const today = new Date();
    return (
      this.currentDate.getFullYear() < today.getFullYear() ||
      (this.currentDate.getFullYear() === today.getFullYear() &&
        (this.currentDate.getMonth() < today.getMonth() ||
          (this.currentDate.getMonth() === today.getMonth() &&
            this.currentDate.getDate() < today.getDate())))
    );
  }

  async deleteActivity(activity: Activity) {
    if (!activity?.id) {
      console.error('[DEBUG] Nessun id attivit� da eliminare:', activity);
      return;
    }
  
    try {
      const id = Number(activity.id); // \U0001f448 forza la conversione a numero
  
      if (isNaN(id)) {
        console.error('[DEBUG] ID non valido (non numerico):', activity.id);
        return;
      }
  
      await this.apiService.deleteActivity(id).toPromise();
      console.log('[DEBUG] Attivit� eliminata con successo:', id);
  
      // Aggiorna lista locale
      this.activitiesToday = this.activitiesToday.filter(a => Number(a.id) !== id);
      this.recentActivities = this.activitiesToday.slice(0, 5);
      this.dailyStats.calories.burned = this.activitiesToday.reduce((sum, a) => sum + (a.calories_burned || 0), 0);
  
    } catch (err) {
      console.error('[DEBUG] Errore durante l\'eliminazione dell\'attivit�:', err);
    }
  }
  
  

  
  /** Naviga alla pagina view-meal per il tipo di pasto selezionato */
  openViewMeal(type: string) {
    const dateStr = this.currentDate.toISOString().split('T')[0];
    this.router.navigate(['/view-meal', type], { queryParams: { date: dateStr } });
  }
}