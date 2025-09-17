
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../shared/services/api.service';
import { DeviceService } from '../shared/services/device.service';
import { ProductService, Product, normalizeProduct } from '../shared/services/product.service';
import { AlertController, ToastController, LoadingController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline } from 'ionicons/icons';

import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonChip,
  IonModal,
  IonIcon,
  IonList,
  IonListHeader,
  IonItemDivider
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonChip,
    IonModal,
    IonIcon,
    IonList,
    IonListHeader,
    IonItemDivider
  ]
})

export class SearchPage implements OnInit, OnDestroy {
  // Parametri passati tramite query string
  // selectedMealType già dichiarato sopra per i parametri query, non serve duplicarla
  selectedMealDate?: string;
  selectedQuantity: number = 100;
  selectedMealType: string = '';
  searchCode = '';
  searchResults: Product[] = [];
  brandedResults: Product[] = [];
  surveyResults: Product[] = [];
  foundationResults: Product[] = [];
  selectedFilter: 'all' | 'branded' | 'survey' | 'foundation' = 'all';
  selectedProduct: Product | null = null;
  showProductModal = false;
  isDesktop = false;
  isMobile = false;
  isScanning = false;
  isLoading = false;
  showManualInput = false;
  private deviceSub?: Subscription;

  private deviceService = inject(DeviceService);
  private productService = inject(ProductService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  constructor() {
    addIcons({ searchOutline });

  }

  ngOnInit() {
    this.deviceSub = this.deviceService.getDeviceChanges().subscribe(deviceInfo => {
      this.isDesktop = deviceInfo.isDesktop;
      this.isMobile = deviceInfo.isMobile;
      if (this.isDesktop) {
        this.showManualInput = true;
      }
    });
  }

  ngOnDestroy() {
    this.stopScanning();
    this.deviceSub?.unsubscribe();
  }

  async startScanning() {
    if (this.isMobile) {
      await this.startCameraScanning();
    } else {
      this.showManualInput = true;
    }
  }

  private async startCameraScanning() {
    try {
      this.isScanning = true;
      // Qui andrà la logica reale di scansione barcode
      setTimeout(() => {
        // Simulazione: nessuna azione
        this.isScanning = false;
      }, 2000);
    } catch (error) {
      console.error('Camera scanning error:', error);
      await this.showErrorToast('Errore durante la scansione');
      this.isScanning = false;
    }
  }

  stopScanning() {
    this.isScanning = false;
  }

  async searchByCode() {
    const query = this.searchCode.trim();
    if (!query) {
      await this.showErrorToast('Inserisci un nome prodotto valido');
      return;
    }
    this.isLoading = true;
    this.searchResults = [];
    this.brandedResults = [];
    this.surveyResults = [];
    this.foundationResults = [];
    try {
      const res = await this.productService.searchProductsByName(query).toPromise();
      if (res && res.success && res.data.products.length > 0) {
        // Normalizza tutti i prodotti ricevuti
        this.searchResults = res.data.products.map(normalizeProduct);
        this.brandedResults = this.searchResults.filter(p => (p as any).category === 'Branded');
        this.surveyResults = this.searchResults.filter(p => (p as any).category === 'Survey (FNDDS)');
        this.foundationResults = this.searchResults.filter(p => (p as any).category === 'Foundation');
      } else {
        await this.showErrorToast('Prodotto non trovato');
      }
    } catch (error) {
      console.error('Search error:', error);
      await this.showErrorToast('Errore durante la ricerca');
    } finally {
      this.isLoading = false;
    }
  }
  setFilter(filter: 'all' | 'branded' | 'survey' | 'foundation') {
    this.selectedFilter = filter;
  }

  /**
   * Mostra i dettagli del prodotto selezionato nel modal.
   * @param product Prodotto selezionato dalla lista
   */
  openProductDetail(product: any) {
    this.selectedProduct = product;
    this.selectedQuantity = product?.serving?.quantity || 100;
    this.showProductModal = true;
  }

  /**
   * Calcola i valori nutrizionali in base alla quantità selezionata.
   * @param quantity Quantità inserita dall’utente (es. 100g)
   * @returns Oggetto con i valori nutrizionali calcolati, oppure null se dati mancanti
   */
  getNutritionalValues(quantity: number) {
    if (!this.selectedProduct || !this.selectedProduct.nutrition_per_100g) return null;
    const n = this.selectedProduct.nutrition_per_100g;
    const factor = quantity / 100;
    return {
      calories: n.calories != null ? Math.round(n.calories * factor) : null,
      proteins: n.proteins != null ? +(n.proteins * factor).toFixed(2) : null,
      carbohydrates: n.carbohydrates != null ? +(n.carbohydrates * factor).toFixed(2) : null,
      fats: n.fats != null ? +(n.fats * factor).toFixed(2) : null,
      sugars: n.sugars != null ? +(n.sugars * factor).toFixed(2) : null,
      fiber: n.fiber != null ? +(n.fiber * factor).toFixed(2) : null,
      sodium: n.sodium != null ? +(n.sodium * factor).toFixed(2) : null,
      saturated_fat: n.saturated_fat != null ? +(n.saturated_fat * factor).toFixed(2) : null
    };
  }

  async addToMeal() {
    if (!this.selectedProduct) return;
    // Preleva i parametri dalla query string (tipo pasto e data)
    const params = this.route.snapshot.queryParams;
    const mealType = params['type'] || '';
    const mealDate = params['date'] || '';
    if (!mealType) {
      await this.showErrorToast('Tipo di pasto non specificato.');
      return;
    }
    await this.addProductToMeal(mealType, mealDate);
  }

  private async addProductToMeal(mealType: string, mealDate?: string) {
    if (!this.selectedProduct) return;
    const product = this.selectedProduct;
    const quantity = this.selectedQuantity;
    const nutrition = this.getNutritionalValues(quantity);
    if (!nutrition) {
      await this.showErrorToast('Dati nutrizionali non disponibili');
      return;
    }
    let consumedAt: string;
    if (mealDate) {
      // Se la data è passata come parametro, usala
      consumedAt = new Date(mealDate).toISOString();
    } else {
      // Altrimenti usa la data attuale
      consumedAt = new Date().toISOString();
    }
    const meal: any = {
      type: mealType,
      date: consumedAt,
      products: [
        {
          productId: product.id,
          name: product.name,
          quantity: quantity,
          unit: product.serving?.unit || 'g',
          nutritionPer100g: {
            calories: product.nutrition_per_100g?.calories ?? 0,
            proteins: product.nutrition_per_100g?.proteins ?? 0,
            carbohydrates: product.nutrition_per_100g?.carbohydrates ?? 0,
            fats: product.nutrition_per_100g?.fats ?? 0,
            fiber: product.nutrition_per_100g?.fiber ?? 0,
            sugar: product.nutrition_per_100g?.sugars ?? 0,
            sodium: product.nutrition_per_100g?.sodium ?? 0,
            saturatedFats: product.nutrition_per_100g?.saturated_fat ?? 0
          },
          totalNutrition: {
            calories: nutrition.calories ?? 0,
            proteins: nutrition.proteins ?? 0,
            carbohydrates: nutrition.carbohydrates ?? 0,
            fats: nutrition.fats ?? 0,
            fiber: nutrition.fiber ?? 0,
            sugar: nutrition.sugars ?? 0,
            sodium: nutrition.sodium ?? 0,
            saturatedFats: nutrition.saturated_fat ?? 0
          }
        }
      ]
    };
    try {
      await this.apiService.createMeal(meal).toPromise();
      await this.showSuccessToast(`Prodotto aggiunto a ${this.getMealTypeName(mealType)}`);
      this.closeProductModal();
      this.router.navigate(['/tabs/dashboard'], { queryParams: { refresh: true } });
    } catch (error) {
      console.error(error);
      await this.showErrorToast('Errore durante la registrazione del pasto');
    }
  }

  private getMealTypeName(type: string): string {
    const names: Record<string, string> = {
      breakfast: 'Colazione',
      lunch: 'Pranzo',
      snack: 'Spuntino',
      dinner: 'Cena'
    };
    return names[type] || type;
  }

  closeProductModal() {
    this.showProductModal = false;
    this.selectedProduct = null;
  }

  // Utility methods
  getRiskLevelColor(level: string): string {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'medium';
    }
  }

  getRiskLevelIcon(level: string): string {
    switch (level) {
      case 'low': return 'checkmark-circle-outline';
      case 'medium': return 'warning-outline';
      case 'high': return 'warning-outline';
      default: return 'information-circle-outline';
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  private async showWarningsAlert(warnings: string[]) {
    const alert = await this.alertController.create({
      header: 'Attenzione!',
      message: warnings.join('\n\n'),
      buttons: ['OK']
    });
    await alert.present();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}