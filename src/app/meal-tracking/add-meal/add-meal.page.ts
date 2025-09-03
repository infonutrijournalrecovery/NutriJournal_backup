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
  IonModal,
  IonDatetime,
  IonRadio,
  IonFab,
  IonFabButton,
  IonFabList,
  ToastController,
  AlertController,
  ModalController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
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

import { 
  Meal, 
  MealItem, 
  MealType, 
  ProductCategory,
  QuantityUnit,
  NutritionInfo,
  MealSearchResult
} from '../../shared/interfaces/meal.interface';

@Component({
  selector: 'app-add-meal',
  templateUrl: './add-meal.page.html',
  styleUrls: ['./add-meal.page.scss'],
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
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonIcon,
    IonThumbnail,
    IonSpinner,
    IonModal,
    IonDatetime,
    IonRadio,
    IonFab,
    IonFabButton,
    IonFabList
  ]
})
export class AddMealPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private loadingController = inject(LoadingController);

  @ViewChild('dateModal') dateModal!: IonModal;
  @ViewChild('mealTypeModal') mealTypeModal!: IonModal;

  // State
  isLoading = false;
  isSaving = false;
  isEditing = false;
  
  // Meal data
  selectedDate: string = new Date().toISOString();
  selectedMealType: MealType | null = null;
  mealItems: MealItem[] = [];
  originalMeal: Meal | null = null;
  
  // UI state
  showDatePicker = false;
  showMealTypeSelector = false;
  
  // Constants
  today = new Date().toISOString();
  mealTypes: MealType[] = ['Colazione', 'Pranzo', 'Spuntini', 'Cena'];
  
  // Exposed Math for template
  Math = Math;

  constructor() {
    addIcons({
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
    });
  }

  async ngOnInit() {
    await this.initializePage();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  /**
   * Initialize page with route parameters
   */
  private async initializePage() {
    try {
      this.isLoading = true;
      
      // Get route parameters
      const params = this.route.snapshot.queryParams;
      const mealId = this.route.snapshot.paramMap.get('id');
      
      // Set date from params or current date
      if (params['date']) {
        this.selectedDate = params['date'];
      }
      
      // Set meal type from params
      if (params['type'] && this.mealTypes.includes(params['type'])) {
        this.selectedMealType = params['type'] as MealType;
      }
      
      // If editing existing meal
      if (mealId) {
        this.isEditing = true;
        await this.loadExistingMeal(mealId);
      }
      
    } catch (error) {
      console.error('Error initializing page:', error);
      await this.showErrorToast('Errore durante il caricamento');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load existing meal for editing
   */
  private async loadExistingMeal(mealId: string) {
    try {
      // TODO: Implement API call to load meal
      // const meal = await this.mealService.getMealById(mealId);
      // this.originalMeal = meal;
      // this.selectedDate = meal.date;
      // this.selectedMealType = meal.type;
      // this.mealItems = [...meal.items];
    } catch (error) {
      console.error('Error loading meal:', error);
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
   * Get icon for meal type
   */
  getMealTypeIcon(type?: MealType): string {
    if (!type) return 'restaurant-outline';
    
    switch (type) {
      case 'Colazione': return 'cafe-outline';
      case 'Pranzo': return 'restaurant-outline';
      case 'Spuntini': return 'fast-food-outline';
      case 'Cena': return 'wine-outline';
      default: return 'restaurant-outline';
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
  openDatePicker() {
    this.showDatePicker = true;
  }

  /**
   * Close date picker
   */
  closeDatePicker() {
    this.showDatePicker = false;
  }

  /**
   * Handle date change
   */
  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
    this.closeDatePicker();
  }

  /**
   * Open meal type selector
   */
  openMealTypeSelector() {
    this.showMealTypeSelector = true;
  }

  /**
   * Close meal type selector
   */
  closeMealTypeSelector() {
    this.showMealTypeSelector = false;
  }

  /**
   * Select meal type
   */
  selectMealType(type: MealType) {
    this.selectedMealType = type;
    this.closeMealTypeSelector();
  }

  /**
   * Track by function for meal items
   */
  trackByItemId(index: number, item: MealItem): string {
    return item.id || index.toString();
  }

  /**
   * Get total calories
   */
  getTotalCalories(): number {
    return Math.round(this.mealItems.reduce((total, item) => total + item.totalNutrition.calories, 0));
  }

  /**
   * Get total proteins
   */
  getTotalProteins(): number {
    return Math.round(this.mealItems.reduce((total, item) => total + item.totalNutrition.proteins, 0) * 10) / 10;
  }

  /**
   * Get total carbs
   */
  getTotalCarbs(): number {
    return Math.round(this.mealItems.reduce((total, item) => total + item.totalNutrition.carbohydrates, 0) * 10) / 10;
  }

  /**
   * Get total fats
   */
  getTotalFats(): number {
    return Math.round(this.mealItems.reduce((total, item) => total + item.totalNutrition.fats, 0) * 10) / 10;
  }
  /**
   * Edit item quantity
   */
  async editItemQuantity(item: MealItem) {
    const alert = await this.alertController.create({
      header: 'Modifica Quantità',
      subHeader: item.productName,
      inputs: [
        {
          name: 'quantity',
          type: 'number',
          placeholder: 'Quantità',
          value: item.quantity.toString()
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
  private updateItemQuantity(item: MealItem, newQuantity: number) {
    item.quantity = newQuantity;
    item.totalNutrition = this.calculateNutritionForQuantity(
      item.nutritionPer100g, 
      newQuantity, 
      item.unit
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
      calories: nutritionPer100g.calories * factor,
      proteins: nutritionPer100g.proteins * factor,
      carbohydrates: nutritionPer100g.carbohydrates * factor,
      fats: nutritionPer100g.fats * factor,
      fiber: nutritionPer100g.fiber ? nutritionPer100g.fiber * factor : undefined,
      sugar: nutritionPer100g.sugar ? nutritionPer100g.sugar * factor : undefined,
      sodium: nutritionPer100g.sodium ? nutritionPer100g.sodium * factor : undefined,
      saturatedFats: nutritionPer100g.saturatedFats ? nutritionPer100g.saturatedFats * factor : undefined
    };
  }

  /**
   * Remove item from meal
   */
  async removeItem(item: MealItem) {
    const alert = await this.alertController.create({
      header: 'Rimuovi Prodotto',
      message: `Vuoi rimuovere ${item.productName} dal pasto?`,
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Rimuovi',
          role: 'destructive',
          handler: () => {
            const index = this.mealItems.findIndex(i => i.id === item.id);
            if (index > -1) {
              this.mealItems.splice(index, 1);
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
   * Save meal
   */
  async saveMeal() {
    if (!this.selectedMealType) {
      await this.showErrorToast('Seleziona il tipo di pasto');
      return;
    }

    if (this.mealItems.length === 0) {
      await this.showErrorToast('Aggiungi almeno un prodotto');
      return;
    }

    try {
      this.isSaving = true;
      
      const mealData: Meal = {
        userId: 'current-user-id', // TODO: Get from auth service
        date: this.selectedDate.split('T')[0], // Extract date part
        type: this.selectedMealType,
        items: this.mealItems,
        totalNutrition: {
          calories: this.getTotalCalories(),
          proteins: this.getTotalProteins(),
          carbohydrates: this.getTotalCarbs(),
          fats: this.getTotalFats()
        }
      };

      // TODO: Implement API call to save meal
      // if (this.isEditing && this.originalMeal?.id) {
      //   await this.mealService.updateMeal(this.originalMeal.id, mealData);
      // } else {
      //   await this.mealService.createMeal(mealData);
      // }

      await this.showSuccessToast(
        this.isEditing ? 'Pasto aggiornato con successo' : 'Pasto salvato con successo'
      );
      
      this.router.navigate(['/tabs/dashboard']);
      
    } catch (error) {
      console.error('Error saving meal:', error);
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

