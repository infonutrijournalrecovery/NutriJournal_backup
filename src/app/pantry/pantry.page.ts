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
/*
import { 
  Meal, 
  MealItem, 
  MealType, 
  ProductCategory,
  QuantityUnit,
  NutritionInfo,
  MealSearchResult
} from '../../shared/interfaces/meal.interface'; */

@Component({
  selector: 'pantry-page',
  templateUrl: './pantry.page.html',
  styleUrls: ['./pantry.page.scss'],
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
export class PantryPage implements OnInit, OnDestroy {
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
      },
      {
        name: 'Latte Intero',
        brand: 'Parmalat',
        quantity: '1 L',
        image: 'assets/img/latte.png',
        lastUsed: '2025-09-05T19:20:00'
      },
      {
        name: 'Latte Intero',
        brand: 'Parmalat',
        quantity: '1 L',
        image: 'assets/img/latte.png',
        lastUsed: '2025-09-05T19:20:00'
      },
      {
        name: 'Latte Intero',
        brand: 'Parmalat',
        quantity: '1 L',
        image: 'assets/img/latte.png',
        lastUsed: '2025-09-05T19:20:00'
      },
      {
        name: 'Latte Intero',
        brand: 'Parmalat',
        quantity: '1 L',
        image: 'assets/img/latte.png',
        lastUsed: '2025-09-05T19:20:00'
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

  goToProduct() {
    this.router.navigate(['/product']);
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
