import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
  refreshOutline, nutritionOutline, fitnessOutline } from 'ionicons/icons';
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
    IonHeader,
    IonToolbar,
    IonTitle,
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

  // Proprietà per il layout responsive
  isDesktop = false;
  isTablet = false;
  isMobile = true;
  deviceLayout: 'mobile' | 'tablet' | 'desktop' = 'mobile';

  private subscriptions = new Subscription();

  // Statistiche giornaliere
  dailyStats = {
    calories: { consumed: 0, goal: 2000, percentage: 0 },
    carbs: { consumed: 0, goal: 250, percentage: 0 },
    proteins: { consumed: 0, goal: 150, percentage: 0 },
    fats: { consumed: 0, goal: 70, percentage: 0 },
    water: { consumed: 0, goal: 2000 }, // ml
    activities: 0
  };

  // Quick actions
  quickActions = [
    { icon: 'cafe-outline', label: 'Colazione', action: 'addMeal', color: 'warning' },
    { icon: 'restaurant-outline', label: 'Pranzo', action: 'addMeal', color: 'success' },
    { icon: 'water-outline', label: 'Acqua', action: 'addWater', color: 'primary' },
    { icon: 'trending-up-outline', label: 'Attività', action: 'addActivity', color: 'tertiary' }
  ];

  constructor(
    // Commentiamo temporaneamente questi servizi
    // private authService: AuthService,
    // private apiService: ApiService,
    private deviceService: DeviceService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({nutritionOutline,trendingUpOutline,flameOutline,fitnessOutline,waterOutline,addOutline,restaurantOutline,cafeOutline,timeOutline,checkmarkCircleOutline,alertCircleOutline,statsChartOutline,refreshOutline});
  }

  ngOnInit() {
    this.initializeDeviceDetection();
    this.loadUserData();
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
      
      // TODO: Sostituire con chiamate API reali
      this.dailyStats.calories.consumed = 1200;
      this.dailyStats.carbs.consumed = 150;
      this.dailyStats.proteins.consumed = 80;
      this.dailyStats.fats.consumed = 45;
      this.dailyStats.water.consumed = 1250;
      this.dailyStats.activities = 2;

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

  private updateNutritionGoals() {
    if (this.user?.nutritionGoals) {
      this.dailyStats.calories.goal = this.user.nutritionGoals.daily_calories || 2000;
      this.dailyStats.carbs.goal = this.user.nutritionGoals.daily_carbs || 250;
      this.dailyStats.proteins.goal = this.user.nutritionGoals.daily_proteins || 150;
      this.dailyStats.fats.goal = this.user.nutritionGoals.daily_fats || 70;
    }
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

  async handleQuickAction(action: any) {
    if (action.action === 'addWater') {
      await this.addWater();
    } else if (action.action === 'addMeal') {
      this.showToast('Funzionalità in arrivo!', 'primary');
    } else if (action.action === 'addActivity') {
      this.showToast('Funzionalità in arrivo!', 'primary');
    }
  }

  async addWater() {
    this.dailyStats.water.consumed += 250; // Aggiungi 250ml
    this.showToast('250ml di acqua aggiunti!', 'success');
    
    // TODO: Salvare nel backend
  }

  getProgressColor(percentage: number): string {
    if (percentage < 50) return 'danger';
    if (percentage < 80) return 'warning';
    return 'success';
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
