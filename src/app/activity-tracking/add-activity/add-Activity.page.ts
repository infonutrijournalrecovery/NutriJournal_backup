import { IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';

import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonIcon,
  IonThumbnail,
  IonSpinner,
  IonRadio,
  IonInput,
  ToastController,
  AlertController,
  ModalController,
  LoadingController
} from '@ionic/angular/standalone';
import {
  Activity, 
  ActivityItem, 
  ActivityType, 
  ProductCategory,
  QuantityUnit,
  NutritionInfo,
  ActivitySearchResult
} from '../../shared/interfaces/Activity.interface';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';
import { EventBusService } from '../../shared/services/event-bus.service';
import { DatePickerModalComponent } from '../../shared/components/date-picker-modal.component';

import {
  checkmarkOutline,
  calendarOutline,
  restaurantOutline,
  addCircleOutline,
  searchOutline,
  homeOutline,
  cameraOutline,
  timeOutline,
  createOutline,
  trashOutline,
  add,
  restaurant,
  leafOutline,
  nutritionOutline,
  pizzaOutline,
  cafeOutline,
  fastFoodOutline,
  wineOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-add-Activity',
  templateUrl: './add-Activity.page.html',
  styleUrls: ['./add-Activity.page.scss'],
  standalone: true,
  providers: [ModalController],
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
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonIcon,
    IonThumbnail,
    IonSpinner,
    IonRadio,
  IonInput,
  IonModal
  ]
})
export class AddActivityPage implements OnInit, OnDestroy {
  private loadingController = inject(LoadingController);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private eventBus = inject(EventBusService);
  private modalController = inject(ModalController);
    private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  // Removed unused @ViewChild IonModal references

  // State
  isLoading = false;
  isSaving = false;
  isEditing = false;
  
  // Activity data
  selectedDate: string = new Date().toISOString();
  selectedActivityType: ActivityType | null = null;
  ActivityItems: ActivityItem[] = [];
  originalActivity: Activity | null = null;
  
  // UI state
  //showDatePicker = false;
  showActivityTypeSelector = false;
  
  // Constants
  today = new Date().toISOString();
  ActivityTypes: ActivityType[] = [
    'Camminata',
    'Corsa',
    'Ciclismo',
    'Nuoto',
    'Palestra',
    'Corpo libero',
    'Sollevamento pesi',
    'Yoga',
    'Stretching',
    'Pilates',
    'Calcio',
    'Basket',
    'Tennis',
    'Pallavolo'
  ];
  // Per la durata inserita dall'utente
  activityDuration: number | null = null;

  // Calorie per minuto per ogni attività (valori medi da fonti attendibili)
  private caloriesPerMinute: Record<string, number> = {
    'Corsa': 10,         // 10 kcal/min (corsa moderata 8-10 km/h)
    'Camminata': 4,      // 4 kcal/min (camminata veloce)
    'Ciclismo': 8,       // 8 kcal/min (ciclismo moderato)
    'Nuoto': 9,          // 9 kcal/min (nuoto stile libero moderato)
    'Palestra': 6,       // 6 kcal/min (allenamento pesi/cardio)
    'Corpo libero': 5,   // 5 kcal/min (bodyweight)
    'Sollevamento pesi': 7, // 7 kcal/min (weightlifting)
    'Yoga': 3,           // 3 kcal/min
    'Stretching': 2,     // 2 kcal/min
    'Pilates': 3,        // 3 kcal/min
    'Calcio': 8,         // 8 kcal/min
    'Basket': 7,         // 7 kcal/min
    'Tennis': 6,         // 6 kcal/min
    'Pallavolo': 5       // 5 kcal/min
  };

  // Calorie calcolate
  get calculatedCalories(): number | null {
    if (!this.selectedActivityType || !this.activityDuration || this.activityDuration <= 0) return null;
    const cpm = this.caloriesPerMinute[this.selectedActivityType] || 5;
    return Math.round(cpm * this.activityDuration);
  }

  // Exposed Math for template
  Math = Math;

  constructor() {
      addIcons({calendarOutline,restaurantOutline,createOutline,trashOutline,addCircleOutline});}

  async ngOnInit() {
    await this.initializePage();
  }

    /**
     * Initialize page with route parameters
     */
    private async initializePage() {
      try {
        this.isLoading = true;
        // Get route parameters
        const params = this.route.snapshot.queryParams;
        const ActivityId = this.route.snapshot.paramMap.get('id');
        // Set date from params or current date
        if (params['date']) {
          this.selectedDate = params['date'];
        }
        // Set Activity type from params
        if (params['type'] && this.ActivityTypes.includes(params['type'])) {
          this.selectedActivityType = params['type'] as ActivityType;
        }
        // If editing existing Activity
        if (ActivityId) {
          this.isEditing = true;
          await this.loadExistingActivity(ActivityId);
        }
      } catch (error) {
        console.error('Error initializing page:', error);
        await this.showErrorToast('Errore durante il caricamento');
      } finally {
        this.isLoading = false;
      }
    }

  ngOnDestroy() {
    // Cleanup if needed
  }

  /**
   * Load existing Activity for editing
   */
  private async loadExistingActivity(ActivityId: string) {
    try {
      // TODO: Implement API call to load Activity
      // const Activity = await this.ActivityService.getActivityById(ActivityId);
      // this.originalActivity = Activity;
      // this.selectedDate = Activity.date;
      // this.selectedActivityType = Activity.type;
      // this.ActivityItems = [...Activity.items];
    } catch (error) {
      console.error('Error loading Activity:', error);
      throw error;
    }
  }

  /**
   * Get back route based on context
   */
  getBackRoute(): string {
    if (this.isEditing) {
      return '/tabs/dashboard';
    }
    return '/tabs/dashboard';
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Oggi';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ieri';
    } else {
      return date.toLocaleDateString('it-IT', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  }

  /**
   * Get icon for Activity type
   */
  getActivityTypeIcon(type?: ActivityType): string {
    if (!type) return 'bicycle-outline';
    switch (type) {
      case 'Corsa': return 'walk-outline';
      case 'Camminata': return 'walk-outline';
      case 'Ciclismo': return 'bicycle-outline';
      case 'Nuoto': return 'water-outline';
      case 'Palestra': return 'barbell-outline';
      case 'Yoga': return 'accessibility-outline';
      default: return 'bicycle-outline';
    }
  }

  /**
   * Get icon for product category
   */
  getCategoryIcon(category?: ProductCategory): string {
    if (!category) return 'nutrition-outline';
    
    switch (category) {
      case 'Verdura': 
      case 'Frutta': return 'leaf-outline';
      case 'Dolci': return 'ice-cream-outline';
      case 'Bibite': return 'wine-outline';
      case 'Carne': 
      case 'Pesce': return 'restaurant-outline';
      case 'Latticini': return 'nutrition-outline';
      default: return 'nutrition-outline';
    }
  }

  goToScanner() {
    this.router.navigate(['/scanner']);
  }
  
  
  goToPantry() {
    this.router.navigate(['/pantry']);
  }

  /**
   * Open date picker
   */
  async openDatePicker() {
    const modal = await this.modalController.create({
      component: DatePickerModalComponent,
      componentProps: {
        date: this.selectedDate,
        max: this.today
      }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      this.selectedDate = data;
    }
  }

  /**
   * Close date picker
   */
  // closeDatePicker() { }

  /**
   * Handle date change
   */
  // onDateChange(event: any) { }

  /**
   * Open Activity type selector
   */
  openActivityTypeSelector() {
    this.showActivityTypeSelector = true;
  }

  /**
   * Close Activity type selector
   */
  closeActivityTypeSelector() {
    this.showActivityTypeSelector = false;
  }

  /**
   * Select Activity type
   */
  selectActivityType(type: ActivityType) {
    this.selectedActivityType = type;
    this.closeActivityTypeSelector();
  }

  /**
   * Track by function for Activity items
   */
  trackByItemId(index: number, item: ActivityItem): string {
  return (typeof item.id === 'string' ? item.id : item.id?.toString()) || index.toString();
  }

  /**
   * Get total calories
   */
  getTotalCalories(): number {
  return Math.round(this.ActivityItems.reduce((total, item) => total + (item.totalNutrition?.calories || 0), 0));
  }

  /**
   * Get total proteins
   */
  getTotalProteins(): number {
  return Math.round(this.ActivityItems.reduce((total, item) => total + (item.totalNutrition?.proteins || 0), 0) * 10) / 10;
  }

  /**
   * Get total carbs
   */
  getTotalCarbs(): number {
  return Math.round(this.ActivityItems.reduce((total, item) => total + (item.totalNutrition?.carbohydrates || 0), 0) * 10) / 10;
  }

  /**
   * Get total fats
   */
  getTotalFats(): number {
  return Math.round(this.ActivityItems.reduce((total, item) => total + (item.totalNutrition?.fats || 0), 0) * 10) / 10;
  }

  /**
   * Edit item quantity
   */
  async editItemQuantity(item: ActivityItem) {
    const alert = await this.alertController.create({
      header: 'Modifica Quantità',
  subHeader: item.name,
      inputs: [
        {
          name: 'quantity',
          type: 'number',
          placeholder: 'Quantità',
          value: (item.quantity ?? '').toString()
        }
      ],
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Conferma',
          handler: (data: any) => {
            const quantity = parseFloat(data.quantity);
            if (quantity > 0) {
              this.updateItemQuantity(item, quantity);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Update item quantity and recalculate nutrition
   */
  private updateItemQuantity(item: ActivityItem, newQuantity: number) {
    item.quantity = newQuantity;
    item.totalNutrition = this.calculateNutritionForQuantity(
  item.nutritionPer100g ?? {calories:0,proteins:0,carbohydrates:0,fats:0},
      newQuantity, 
  item.unit ?? 'g'
    );
  }

  /**
   * Calculate nutrition for specific quantity
   */
  private calculateNutritionForQuantity(
    nutritionPer100g: NutritionInfo, 
    quantity: number, 
    unit: QuantityUnit
  ): NutritionInfo {
    // Convert quantity to grams/ml for calculation
    let quantityIn100gUnits = quantity;
    
    if (unit === 'porzione' || unit === 'pezzo') {
      // Assume average portion sizes
      quantityIn100gUnits = quantity * 100; // 1 portion = 100g
    } else if (unit === 'tazza') {
      quantityIn100gUnits = quantity * 240; // 1 cup = 240g/ml
    } else if (unit === 'cucchiaio') {
      quantityIn100gUnits = quantity * 15; // 1 tablespoon = 15g/ml
    }
    
    const factor = quantityIn100gUnits / 100;
    
    return {
  calories: (nutritionPer100g.calories ?? 0) * factor,
  proteins: (nutritionPer100g.proteins ?? 0) * factor,
  carbohydrates: (nutritionPer100g.carbohydrates ?? 0) * factor,
  fats: (nutritionPer100g.fats ?? 0) * factor,
      fiber: nutritionPer100g.fiber ? nutritionPer100g.fiber * factor : undefined,
      sugar: nutritionPer100g.sugar ? nutritionPer100g.sugar * factor : undefined,
      sodium: nutritionPer100g.sodium ? nutritionPer100g.sodium * factor : undefined,
      saturatedFats: nutritionPer100g.saturatedFats ? nutritionPer100g.saturatedFats * factor : undefined
    };
  }

  /**
   * Remove item from Activity
   */
  async removeItem(item: ActivityItem) {
  const alert = await this.alertController.create({
      header: 'Rimuovi Prodotto',
  message: `Vuoi rimuovere ${item.name} dal pasto?`,
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Rimuovi',
          role: 'destructive',
          handler: () => {
            const index = this.ActivityItems.findIndex(i => i.id === item.id);
            if (index > -1) {
              this.ActivityItems.splice(index, 1);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Open search modal
   */
  async openSearchModal() {
    try {
      // TODO: Implement search modal
      console.log('Opening search modal');
      await this.showToast('Funzionalità in sviluppo');
    } catch (error) {
      console.error('Error opening search modal:', error);
    }
  }

  /**
   * Open pantry modal
   */
  async openPantryModal() {
    try {
      // TODO: Implement pantry modal
      console.log('Opening pantry modal');
      await this.showToast('Funzionalità in sviluppo');
    } catch (error) {
      console.error('Error opening pantry modal:', error);
    }
  }

  /**
   * Open barcode scanner
   */
  async openBarcodeScanner() {
    try {
      // TODO: Implement barcode scanner
      console.log('Opening barcode scanner');
      await this.showToast('Funzionalità in sviluppo');
    } catch (error) {
      console.error('Error opening scanner:', error);
    }
  }

  /**
   * Open recent products modal
   */
  async openRecentModal() {
    try {
      // TODO: Implement recent products modal
      console.log('Opening recent modal');
      await this.showToast('Funzionalità in sviluppo');
    } catch (error) {
      console.error('Error opening recent modal:', error);
    }
  }

  /**
   * Open quick add menu
   */
  openQuickAddMenu() {
    // This will trigger the FAB list
  }

  /**
   * Save Activity
   */
  async saveActivity() {
    if (!this.selectedActivityType) {
      await this.showErrorToast('Seleziona il tipo di attività');
      return;
    }
    if (!this.activityDuration || this.activityDuration <= 0) {
      await this.showErrorToast('Inserisci la durata in minuti');
      return;
    }
    try {
      this.isSaving = true;
      // Prendi userId dall'utente loggato
      const user = this.authService.currentUser || { id: null };
      if (!user.id) {
        await this.showErrorToast('Utente non autenticato');
        return;
      }
      // Mappa tra nome italiano e chiave backend
      const activityTypeMap: { [key: string]: string } = {
        'Camminata': 'walking',
        'Corsa': 'running',
        'Ciclismo': 'cycling',
        'Nuoto': 'swimming',
        'Palestra': 'gym',
        'Corpo libero': 'bodyweight',
        'Sollevamento pesi': 'weightlifting',
        'Yoga': 'yoga',
        'Stretching': 'stretching',
        'Pilates': 'pilates',
        'Calcio': 'soccer',
        'Basket': 'basketball',
        'Tennis': 'tennis',
        'Pallavolo': 'volleyball',
        'Ballo': 'dancing',
        'Escursione': 'hiking',
        'Giardinaggio': 'gardening'
      };
      const typeKey = activityTypeMap[this.selectedActivityType as string] || 'other';
      const activityData: any = {
        userId: user.id,
        date: this.selectedDate.split('T')[0],
        type: typeKey,
        name: this.selectedActivityType, // Nome italiano per visualizzazione
        duration: this.activityDuration,
        calories: this.calculatedCalories
      };
      await this.apiService.createActivity(activityData).toPromise();
      // Aggiorna il counter giornaliero delle calorie bruciate
      await this.apiService.saveCaloriesBurned(activityData.date, activityData.calories).toPromise();
      // Emit event for dashboard update
      this.eventBus.emitDataUpdated('activity');
      await this.showSuccessToast(
        this.isEditing ? 'Attività aggiornata con successo' : 'Attività salvata con successo'
      );
      this.router.navigate(['/tabs/dashboard']);
    } catch (error) {
      console.error('Error saving Activity:', error);
      await this.showErrorToast('Errore durante il salvataggio');
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Show success toast
   */
  private async showSuccessToast(message: string) {
  const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Show error toast
   */
  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Show general toast
   */
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}

