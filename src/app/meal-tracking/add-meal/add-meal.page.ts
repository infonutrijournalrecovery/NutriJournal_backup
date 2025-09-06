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
  IonAvatar,
  IonNote,
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
    IonFabList,
    IonAvatar,
    IonNote
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

  recentProducts: any[] = []; // \u2705 lista dinamica di prodotti recenti

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

    // \u2705 Simulazione prodotti recenti - qui puoi sostituire con chiamata HTTP
    this.recentProducts = [
      {
        name: 'Pasta Barilla',
        brand: 'Barilla',
        quantity: '150 g',
        image: 'assets/img/pasta.png',
        lastUsed: '2025-09-06T12:30:00'
      },
      {
        name: 'Latte Intero',
        brand: 'Parmalat',
        quantity: '1 L',
        image: 'assets/img/latte.png',
        lastUsed: '2025-09-05T19:20:00'
      }
    ];
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
      }
      
    } catch (error) {
      console.error('Error initializing page:', error);
      await this.showErrorToast('Errore durante il caricamento');
    } finally {
      this.isLoading = false;
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

  goToSearch() {
    this.router.navigate(['/search']);
  }
  
  goToPantry() {
    this.router.navigate(['/pantry']);
  }

  openDatePicker() {
    this.showDatePicker = true;
  }

  closeDatePicker() {
    this.showDatePicker = false;
  }

  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
    this.closeDatePicker();
  }

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
      header: 'Modifica Quantit�',
      subHeader: item.productName,
      inputs: [
        {
          name: 'quantity',
          type: 'number',
          placeholder: 'Quantit�',
          value: item.quantity.toString()
        }
      ],
      buttons: [
        { text: 'Annulla', role: 'cancel' },
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
        userId: 'current-user-id',
        date: this.selectedDate.split('T')[0],
        type: this.selectedMealType,
        items: this.mealItems,
        totalNutrition: {
          calories: this.getTotalCalories(),
          proteins: this.getTotalProteins(),
          carbohydrates: this.getTotalCarbs(),
          fats: this.getTotalFats()
        }
      };

      // TODO: chiamata API per salvare il pasto

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
