
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../shared/services/api.service';
import { DeviceService } from '../shared/services/device.service';
import { ProductService, Product } from '../shared/services/product.service';
import { AlertController, ToastController, LoadingController } from '@ionic/angular/standalone';

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
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  constructor() {}

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
        this.searchResults = res.data.products;
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
    const alert = await this.alertController.create({
      header: 'Aggiungi al Pasto',
      message: `Vuoi aggiungere "${this.selectedProduct.name}" a un pasto?`,
      buttons: [
        { text: 'Colazione', handler: () => this.addProductToMeal('breakfast') },
        { text: 'Pranzo', handler: () => this.addProductToMeal('lunch') },
        { text: 'Spuntino', handler: () => this.addProductToMeal('snack') },
        { text: 'Cena', handler: () => this.addProductToMeal('dinner') },
        { text: 'Annulla', role: 'cancel' }
      ]
    });
    await alert.present();
  }

  private async addProductToMeal(mealType: string) {
    if (!this.selectedProduct) return;
    const product = this.selectedProduct;
    const quantity = this.selectedQuantity;
    const nutrition = this.getNutritionalValues(quantity);
    if (!nutrition) {
      await this.showErrorToast('Dati nutrizionali non disponibili');
      return;
    }
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const meal: Partial<any> = {
      name: this.getMealTypeName(mealType),
      type: mealType,
      consumed_at: today.toISOString(),
      total_calories: nutrition.calories,
      total_proteins: nutrition.proteins,
      total_carbs: nutrition.carbohydrates,
      total_fats: nutrition.fats,
      items: [
        {
          product_id: product.id,
          quantity: quantity,
          unit: product.serving?.unit || 'g',
          calories: nutrition.calories,
          proteins: nutrition.proteins,
          carbs: nutrition.carbohydrates,
          fats: nutrition.fats
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
