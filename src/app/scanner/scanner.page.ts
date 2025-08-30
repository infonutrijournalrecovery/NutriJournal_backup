import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSearchbar,
  IonList,
  IonAvatar,
  IonBadge,
  IonChip,
  IonProgressBar,
  IonSpinner,
  IonAlert,
  IonModal,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { DeviceService } from '../shared/services/device.service';
import { addIcons } from 'ionicons';
import {
  scanOutline,
  cameraOutline,
  searchOutline,
  barcodeOutline,
  warningOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  nutritionOutline,
  addOutline,
  closeOutline, createOutline, listOutline } from 'ionicons/icons';

interface ProductInfo {
  code: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  nutrition: {
    energy: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
    sugars: number;
    salt: number;
    fiber?: number;
  };
  additives: Array<{
    code: string;
    name: string;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  allergens: string[];
  categories?: string[];
  ingredients?: string;
}

interface UserPreferences {
  allergens: string[];
  sensitiveAdditives: string[];
  avoidHighRisk: boolean;
}

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonAvatar,
    IonChip,
    IonSpinner,
    IonModal
  ]
})
export class ScannerPage implements OnInit, OnDestroy {
  private deviceService = inject(DeviceService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  // Device detection
  isDesktop = false;
  isMobile = false;

  // Scanner states
  isScanning = false;
  isLoading = false;
  showManualInput = false;
  
  // Search & Results
  searchCode = '';
  searchResults: ProductInfo[] = [];
  selectedProduct: ProductInfo | null = null;
  showProductModal = false;

  // User preferences (mock data for now)
  userPreferences: UserPreferences = {
    allergens: ['lactose', 'gluten'],
    sensitiveAdditives: ['E621', 'E951'],
    avoidHighRisk: true
  };

  // Demo products (simulated database)
  private demoProducts: ProductInfo[] = [
    {
      code: '8076809513726',
      name: 'Barilla Pasta Integrale',
      brand: 'Barilla',
      imageUrl: 'assets/images/products/barilla-pasta.jpg',
      nutrition: {
        energy: 348,
        proteins: 12.5,
        carbohydrates: 67.6,
        fats: 2.5,
        sugars: 3.2,
        salt: 0.006
      },
      additives: [],
      allergens: ['glutine'],
      categories: ['pasta', 'integrale'],
      ingredients: 'Semola di grano duro integrale'
    },
    {
      code: '8000500037454',
      name: 'Nutella',
      brand: 'Ferrero',
      imageUrl: 'assets/images/products/nutella.jpg',
      nutrition: {
        energy: 539,
        proteins: 6.3,
        carbohydrates: 57.5,
        fats: 30.9,
        sugars: 56.3,
        salt: 0.107
      },
      additives: [
        { code: 'E322', name: 'Lecitina di soia', riskLevel: 'low' },
        { code: 'E476', name: 'Poliglicerolo poliricinoleato', riskLevel: 'medium' }
      ],
      allergens: ['latte', 'nocciole', 'soia'],
      categories: ['dolci', 'creme spalmabili'],
      ingredients: 'Zucchero, olio di palma, nocciole 13%, cacao magro 7.4%, latte scremato in polvere 6.6%'
    }
  ];

  constructor() {
    addIcons({barcodeOutline,searchOutline,cameraOutline,closeOutline,scanOutline,createOutline,nutritionOutline,warningOutline,listOutline,addOutline,checkmarkCircleOutline,informationCircleOutline});
  }

  ngOnInit() {
    // Subscribe to device changes
    this.deviceService.getDeviceChanges().subscribe(deviceInfo => {
      this.isDesktop = deviceInfo.isDesktop;
      this.isMobile = deviceInfo.isMobile;
      
      // Show manual input by default on desktop
      if (this.isDesktop) {
        this.showManualInput = true;
      }
    });
  }

  ngOnDestroy() {
    this.stopScanning();
  }

  // Scanner Methods
  async startScanning() {
    if (this.isMobile) {
      // Mobile: Use camera for barcode scanning
      await this.startCameraScanning();
    } else {
      // Desktop: Show manual input
      this.showManualInput = true;
    }
  }

  private async startCameraScanning() {
    try {
      this.isScanning = true;
      // Here we would integrate with a barcode scanner library
      // For now, simulate scanning after 2 seconds
      setTimeout(() => {
        this.simulateSuccessfulScan('8076809513726');
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

  // Manual search methods
  async searchByCode() {
    if (!this.searchCode.trim()) {
      await this.showErrorToast('Inserisci un codice barcode valido');
      return;
    }

    this.isLoading = true;
    
    try {
      // Simulate API call
      await this.delay(1000);
      const product = this.findProductByCode(this.searchCode);
      
      if (product) {
        await this.processScannedProduct(product);
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

  // Product processing
  private simulateSuccessfulScan(code: string) {
    const product = this.findProductByCode(code);
    if (product) {
      this.processScannedProduct(product);
    } else {
      this.showErrorToast('Prodotto non riconosciuto');
    }
    this.isScanning = false;
  }

  private findProductByCode(code: string): ProductInfo | null {
    return this.demoProducts.find(p => p.code === code) || null;
  }

  private async processScannedProduct(product: ProductInfo) {
    this.selectedProduct = product;
    
    // Check for allergens and additives
    const warnings = this.checkProductWarnings(product);
    
    if (warnings.length > 0) {
      await this.showWarningsAlert(warnings);
    }
    
    this.showProductModal = true;
  }

  // Warning system
  private checkProductWarnings(product: ProductInfo): string[] {
    const warnings: string[] = [];
    
    // Check allergens
    const userAllergens = this.userPreferences.allergens;
    const productAllergens = product.allergens;
    const foundAllergens = productAllergens.filter(allergen => 
      userAllergens.some(userAllergen => 
        allergen.toLowerCase().includes(userAllergen.toLowerCase())
      )
    );
    
    if (foundAllergens.length > 0) {
      warnings.push(`⚠️ Contiene allergeni: ${foundAllergens.join(', ')}`);
    }
    
    // Check sensitive additives
    const sensitiveAdditives = product.additives.filter(additive =>
      this.userPreferences.sensitiveAdditives.includes(additive.code)
    );
    
    if (sensitiveAdditives.length > 0) {
      warnings.push(`⚠️ Contiene additivi sensibili: ${sensitiveAdditives.map(a => a.name).join(', ')}`);
    }
    
    // Check high-risk additives
    if (this.userPreferences.avoidHighRisk) {
      const highRiskAdditives = product.additives.filter(additive => 
        additive.riskLevel === 'high'
      );
      
      if (highRiskAdditives.length > 0) {
        warnings.push(`🚨 Contiene additivi ad alto rischio: ${highRiskAdditives.map(a => a.name).join(', ')}`);
      }
    }
    
    return warnings;
  }

  // Modal actions
  async addToMeal() {
    if (!this.selectedProduct) return;
    
    const alert = await this.alertController.create({
      header: 'Aggiungi al Pasto',
      message: `Vuoi aggiungere "${this.selectedProduct.name}" a un pasto?`,
      buttons: [
        {
          text: 'Colazione',
          handler: () => this.addProductToMeal('breakfast')
        },
        {
          text: 'Pranzo',
          handler: () => this.addProductToMeal('lunch')
        },
        {
          text: 'Spuntino',
          handler: () => this.addProductToMeal('snack')
        },
        {
          text: 'Cena',
          handler: () => this.addProductToMeal('dinner')
        },
        {
          text: 'Annulla',
          role: 'cancel'
        }
      ]
    });
    
    await alert.present();
  }

  private async addProductToMeal(mealType: string) {
    // Here we would save to the backend/local storage
    await this.showSuccessToast(`Prodotto aggiunto a ${this.getMealTypeName(mealType)}`);
    this.closeProductModal();
    // Navigate back to dashboard
    this.router.navigate(['/tabs/dashboard']);
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

  // Toast and Alert helpers
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
