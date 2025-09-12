
import { CommonModule, DatePipe } from '@angular/common';
import { IonModal } from '@ionic/angular/standalone';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EventBusService } from '../../shared/services/event-bus.service';
import { ApiService } from '../../shared/services/api.service';
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
  IonNote,
  ToastController,
  AlertController,
  ModalController,
  LoadingController
} from '@ionic/angular/standalone';
import { DatePickerModalComponent } from '../../shared/components/date-picker-modal.component';
import {
  Meal, 
  MealItem, 
  MealType, 
  ProductCategory,
  QuantityUnit,
  NutritionInfo,
  MealSearchResult
} from '../../shared/interfaces/meal.interface';

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
    IonRadio,
  IonNote,
  IonModal,
  DatePipe
  ]
})
export class AddMealPage implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private eventBus = inject(EventBusService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private loadingController = inject(LoadingController);

  // Removed unused @ViewChild IonModal references

  recentProducts: any[] = []; // lista dinamica di prodotti recenti

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
  //showDatePicker = false;
  showMealTypeSelector = false;
  
  // Constants
  today = new Date().toISOString();
  mealTypes: MealType[] = ['Colazione', 'Pranzo', 'Spuntini', 'Cena'];
  
  // Exposed Math for template
  Math = Math;


  constructor() {}

  // Returns the icon name for a given meal type
  getMealTypeIcon(type?: string): string {
    switch ((type || this.selectedMealType)?.toLowerCase()) {
      case 'colazione':
      case 'breakfast':
        return 'cafe-outline';
      case 'pranzo':
      case 'lunch':
        return 'restaurant-outline';
      case 'spuntini':
      case 'snack':
        return 'pizza-outline';
      case 'cena':
      case 'dinner':
        return 'moon-outline';
      default:
        return 'fast-food-outline';
    }
  }

  // Returns the icon name for a given product category
  getCategoryIcon(category?: string): string {
    switch ((category || '').toLowerCase()) {
      case 'frutta':
      case 'fruit':
        return 'leaf-outline';
      case 'verdura':
      case 'vegetable':
        return 'nutrition-outline';
      case 'carne':
      case 'meat':
        return 'fast-food-outline';
      case 'pesce':
      case 'fish':
        return 'fish-outline';
      case 'bevande':
      case 'beverage':
        return 'wine-outline';
      default:
        return 'restaurant-outline';
    }
  }

  // Navigates to the scanner page
  goToScanner() {
    this.router.navigate(['/scanner']);
  }

  async ngOnInit() {
    await this.initializePage();
    await this.loadRecentProducts();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  /**
   * Gestisce il click su un prodotto recente
   */
  selectProduct(product: any) {
    console.log('Prodotto selezionato:', product);
    // TODO: Aggiungi logica per aggiungerlo al pasto o aprire modal dettagli
    this.showToast(`${product.name} selezionato`);
  }

  /**
   * Initialize page with route parameters
   */
  private async initializePage() {
    try {
      this.isLoading = true;
      const params = this.route.snapshot.queryParams;
      const mealId = this.route.snapshot.paramMap.get('id');
      if (params['date']) {
        this.selectedDate = params['date'];
      }
      if (params['type'] && this.mealTypes.includes(params['type'])) {
        this.selectedMealType = params['type'] as MealType;
      }
      if (mealId) {
        this.isEditing = true;
        await this.loadExistingMeal(mealId);
      } else if (this.selectedDate && this.selectedMealType) {
        await this.loadMealForDateAndType(this.selectedDate, this.selectedMealType);
      }
    } catch (error) {
      console.error('Error initializing page:', error);
      await this.showErrorToast('Errore durante il caricamento');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadMealForDateAndType(date: string, type: string) {
    // Carica i prodotti già consumati per data e tipo pasto
    try {
      const res = await this.apiService.getMealsByDate(date, type.toLowerCase()).toPromise();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const meal = res.data[0]; // la API ora restituisce solo i pasti di quel tipo
        if (meal && Array.isArray(meal.items)) {
          this.mealItems = meal.items.map(item => ({
            productId: String((item as any).product_id ?? (item as any).productId ?? ''),
            quantity: item.quantity,
            unit: item.unit,
            nutritionPer100g: {},
            totalNutrition: {
              calories: item.calories,
              proteins: item.proteins,
              carbohydrates: item.carbs,
              fats: item.fats
            }
          })) as any;
        }
      }
    } catch (e) {
      // Silenzia errori se non ci sono pasti
    }
  }



  private async loadExistingMeal(mealId: string) {
    try {
      // TODO: Implement API call to load meal
    } catch (error) {
      console.error('Error loading meal:', error);
      throw error;
    }
  }

  getBackRoute(): string {
    return '/tabs/dashboard';
  }

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
      // Mappa i campi secondo l'interfaccia MealItem dell'API
      const mealData = {
        type: this.selectedMealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        consumed_at: this.selectedDate.split('T')[0],
        items: this.mealItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.totalNutrition?.calories ?? 0,
          proteins: item.totalNutrition?.proteins ?? 0,
          carbs: item.totalNutrition?.carbohydrates ?? 0,
          fats: item.totalNutrition?.fats ?? 0
        }))
      };
      await this.apiService.createMeal(mealData as any).toPromise();
      this.eventBus.emitDataUpdated('meal');
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
  goToSearch() {
    this.router.navigate(['/search']);
  }
  
  goToPantry() {
    this.router.navigate(['/pantry']);
  }

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

  // closeDatePicker() { }

  // onDateChange(event: any) { }

  openMealTypeSelector() {
    this.showMealTypeSelector = true;
  }

  closeMealTypeSelector() {
    this.showMealTypeSelector = false;
  }

  selectMealType(type: MealType) {
    this.selectedMealType = type;
    this.closeMealTypeSelector();
  }

  trackByItemId(index: number, item: MealItem): string {
    return item.id || index.toString();
  }

  getTotalCalories(): number {
    return Math.round(this.mealItems.reduce((total, item) => total + item.totalNutrition.calories, 0));
  }

  getTotalProteins(): number {
    return Math.round(this.mealItems.reduce((total, item) => total + item.totalNutrition.proteins, 0) * 10) / 10;
  }

  getTotalCarbs(): number {
    return Math.round(this.mealItems.reduce((total, item) => total + item.totalNutrition.carbohydrates, 0) * 10) / 10;
  }

  getTotalFats(): number {
    return Math.round(this.mealItems.reduce((total, item) => total + item.totalNutrition.fats, 0) * 10) / 10;
  }


  async editItemQuantity(item: MealItem) {
    const alert = await this.alertController.create({
      header: 'Modifica Quantità',
      subHeader: item.productName,
      // ...altri parametri dell'alert...
    });
    await alert.present();
  }

  // Carica prodotti recenti dai pasti della data odierna
  private async loadRecentProducts() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await this.apiService.getMealsByDate(today).toPromise();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const products: any[] = [];
        res.data.forEach(meal => {
          if (Array.isArray(meal.items)) {
            meal.items.forEach(item => {
              if (!products.find(p => p.product_id === item.product_id)) {
                products.push({
                  ...item.product,
                  quantity: item.quantity,
                  lastUsed: meal.consumed_at
                });
              }
            });
          }
        });
        this.recentProducts = products;
      }
    } catch (e) {
      // Silenzia errori se non ci sono pasti
    }
  }

  private updateItemQuantity(item: MealItem, newQuantity: number) {
    item.quantity = newQuantity;
    item.totalNutrition = this.calculateNutritionForQuantity(
      item.nutritionPer100g, 
      newQuantity, 
      item.unit
    );
  }

  private calculateNutritionForQuantity(
    nutritionPer100g: NutritionInfo, 
    quantity: number, 
    unit: QuantityUnit
  ): NutritionInfo {
    let quantityIn100gUnits = quantity;
    
    if (unit === 'porzione' || unit === 'pezzo') {
      quantityIn100gUnits = quantity * 100;
    } else if (unit === 'tazza') {
      quantityIn100gUnits = quantity * 240;
    } else if (unit === 'cucchiaio') {
      quantityIn100gUnits = quantity * 15;
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

  async removeItem(item: MealItem) {
    const alert = await this.alertController.create({
      header: 'Rimuovi Prodotto',
      message: `Vuoi rimuovere ${item.productName} dal pasto?`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Rimuovi',
          role: 'destructive',
          handler: () => {
            const index = this.mealItems.findIndex(i => i.id === item.id);
            if (index > -1) this.mealItems.splice(index, 1);
          }
        }
      ]
    });

    await alert.present();
  }

  async openSearchModal() {
    console.log('Opening search modal');
    await this.showToast('Funzionalit� in sviluppo');
  }

  async openPantryModal() {
    console.log('Opening pantry modal');
    await this.showToast('Funzionalit� in sviluppo');
  }

  async openBarcodeScanner() {
    console.log('Opening barcode scanner');
    await this.showToast('Funzionalit� in sviluppo');
  }

  async openRecentModal() {
    console.log('Opening recent modal');
    await this.showToast('Funzionalit� in sviluppo');
  }

  openQuickAddMenu() {}


  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
