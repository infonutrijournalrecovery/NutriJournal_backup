import { addIcons } from 'ionicons';
import {
} from 'ionicons/icons';
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
  MealSearchResult,
  MEAL_TYPES,
  MealTypeCanonical
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
  selectedMealType: MealTypeCanonical | null = null;

  /** Normalizza un tipo pasto da qualsiasi input (es. da parametri o vecchi valori) */
  normalizeMealType(input: string | null | undefined): MealTypeCanonical | null {
    if (!input) return null;
    const map: Record<string, MealTypeCanonical> = {
      'colazione': 'breakfast',
      'pranzo': 'lunch',
      'cena': 'dinner',
      'spuntino': 'snack',
      'spuntini': 'snack',
      'breakfast': 'breakfast',
      'lunch': 'lunch',
      'dinner': 'dinner',
      'snack': 'snack',
    };
    return map[input.toLowerCase()] || null;
  }
  /** Restituisce la label italiana per il tipo canonico */
  getMealTypeLabel(type: MealTypeCanonical | null): string {
    const found = this.mealTypes.find(t => t.value === type);
    return found ? found.label : 'Seleziona tipo';
  }

  /** Verifica se il tipo è selezionato */
  isMealTypeSelected(type: MealTypeCanonical): boolean {
    return this.selectedMealType === type;
  }
  mealItems: MealItem[] = [];
  originalMeal: Meal | null = null;
  
  // UI state
  //showDatePicker = false;
  showMealTypeSelector = false;
  
  // Constants
  today = new Date().toISOString();
  // Canonical meal types for selection (label-value)
  mealTypes: { label: string; value: MealTypeCanonical }[] = [
    { label: 'Colazione', value: 'breakfast' },
    { label: 'Pranzo', value: 'lunch' },
    { label: 'Cena', value: 'dinner' },
    { label: 'Spuntini', value: 'snack' }
  ];
  
  // Exposed Math for template
  Math = Math;


  constructor() {
      addIcons({checkmarkOutline,calendarOutline,restaurantOutline,createOutline,trashOutline,addCircleOutline,searchOutline,homeOutline,cameraOutline,timeOutline,restaurant});}

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
    // Copia tutti i dati utili dal prodotto selezionato
  const name = product.name || product.display_name;
    const calories = product.calories ?? product.nutritionPer100g?.calories;
    const proteins = product.proteins ?? product.nutritionPer100g?.proteins;
    const carbs = product.carbs ?? product.nutritionPer100g?.carbohydrates;
    const fats = product.fats ?? product.nutritionPer100g?.fats;
    // Controllo dati minimi
    if (!name || calories == null || proteins == null || carbs == null || fats == null) {
      this.showErrorToast('Il prodotto selezionato non ha dati nutrizionali completi. Scegli un altro prodotto o completa i dati.');
      return;
    }
    // Aggiungi a mealItems
    this.mealItems.push({
      productId: String(product.id || product.productId),
      name,
      productBrand: product.brand || product.productBrand,
      quantity: 100, // default, l'utente può modificarlo
      unit: 'g',
      nutritionPer100g: {
        calories,
        proteins,
        carbohydrates: carbs,
        fats
      },
      totalNutrition: {
        calories,
        proteins,
        carbohydrates: carbs,
        fats
      },
      category: product.category,
      ean: product.ean,
      imageUrl: product.imageUrl
    });
    this.showToast(`${name} aggiunto al pasto`);
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
      if (params['type']) {
        const normalized = this.normalizeMealType(params['type']);
        if (normalized) {
          this.selectedMealType = normalized;
        }
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
    // Controllo dati minimi e normalizzazione per ogni prodotto
    for (const item of this.mealItems) {
      const n = item.totalNutrition || {};
      if (
        !item.name ||
        n.calories == null || n.proteins == null || n.carbohydrates == null || n.fats == null ||
        isNaN(n.calories) || isNaN(n.proteins) || isNaN(n.carbohydrates) || isNaN(n.fats)
      ) {
        await this.showErrorToast('Ogni prodotto deve avere nome, calorie, proteine, carboidrati e grassi. Completa i dati o scegli un prodotto diverso.');
        return;
      }
    }
    try {
      this.isSaving = true;
      // Costruisci items/products garantendo sempre la presenza di 'name'
      const buildProductPayload = (item: any) => {
        // Prova a recuperare il nome da più fonti
        const name = item.name || item.display_name || item.nome || item.productName || '';
        if (!name) {
          throw new Error(`Il prodotto con ID ${item.productId || item.product_id} non ha un nome valido. Correggi o scegli un altro prodotto.`);
        }
        // Estrai tutti i campi nutrizionali disponibili
        const total = item.totalNutrition || {};
        const per100g = item.nutritionPer100g || {};
        return {
          product_id: item.productId,
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          name,
          brand: item.productBrand,
          nutritionPer100g: {
            calories: per100g.calories ?? 0,
            proteins: per100g.proteins ?? 0,
            carbohydrates: per100g.carbohydrates ?? 0,
            fats: per100g.fats ?? 0,
            fiber: per100g.fiber ?? 0,
            sugar: per100g.sugar ?? per100g.sugars ?? 0,
            sodium: per100g.sodium ?? 0,
            saturatedFats: per100g.saturatedFats ?? per100g.saturated_fat ?? 0,
            vitaminC: per100g.vitaminC ?? 0,
            calcium: per100g.calcium ?? 0
          },
          totalNutrition: {
            calories: total.calories ?? 0,
            proteins: total.proteins ?? 0,
            carbohydrates: total.carbohydrates ?? 0,
            fats: total.fats ?? 0,
            fiber: total.fiber ?? 0,
            sugar: total.sugar ?? total.sugars ?? 0,
            sodium: total.sodium ?? 0,
            saturatedFats: total.saturatedFats ?? total.saturated_fat ?? 0,
            vitaminC: total.vitaminC ?? 0,
            calcium: total.calcium ?? 0
          },
          category: item.category,
          ean: item.ean,
          imageUrl: item.imageUrl
        };
      };
      let items: any[] = [];
      let products: any[] = [];
      try {
        items = this.mealItems.map(buildProductPayload);
        products = this.mealItems.map(buildProductPayload);
      } catch (err: any) {
        this.showErrorToast(err.message || 'Errore dati prodotto');
        this.isSaving = false;
        return;
      }
      const mealData = {
        type: this.selectedMealType as MealTypeCanonical,
        date: this.selectedDate.split('T')[0],
        consumed_at: this.selectedDate.split('T')[0],
        items,
        products
      };
      // Log di debug per payload
      // eslint-disable-next-line no-console
      console.log('[DEBUG][saveMeal] Payload inviato:', mealData);
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
    this.router.navigate(['/search'], {
      queryParams: {
        type: this.selectedMealType || 'lunch', // fallback sicuro
        date: this.selectedDate
      }
    });
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

  selectMealType(type: MealTypeCanonical) {
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
  subHeader: item.name,
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
  message: `Vuoi rimuovere ${item.name} dal pasto?`,
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
