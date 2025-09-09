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
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { DeviceService } from '../shared/services/device.service';
import { addIcons } from 'ionicons';
import {
  scanOutline,
  cameraOutline,
  searchOutline,
  barcodeOutline,
  createOutline,
  closeOutline
} from 'ionicons/icons';

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
    IonSpinner
  ]
})
export class ScannerPage implements OnInit, OnDestroy {
  private deviceService = inject(DeviceService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  // Device detection
  isDesktop = false;
  isMobile = false;

  // Scanner states
  isScanning = false;
  isLoading = false;
  showManualInput = false;
  
  // Search
  searchCode = '';

  constructor() {
    addIcons({ 
      barcodeOutline, 
      searchOutline, 
      cameraOutline, 
      scanOutline, 
      createOutline,
      closeOutline 
    });
  }

  ngOnInit() {
    this.deviceService.getDeviceChanges().subscribe(deviceInfo => {
      this.isDesktop = deviceInfo.isDesktop;
      this.isMobile = deviceInfo.isMobile;
      
      if (this.isDesktop) {
        this.showManualInput = true;
      }
    });
  }

  ngOnDestroy() {
    this.stopScanning();
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
      // Qui implementeremo in futuro l'integrazione con una libreria per la scansione
      setTimeout(() => {
        const scannedCode = '8076809513726'; // Simulazione scansione
        this.navigateToProduct(scannedCode);
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
    if (!this.searchCode.trim()) {
      await this.showErrorToast('Inserisci un codice barcode valido');
      return;
    }

    this.isLoading = true;
  
    this.router.navigate(['/product', this.searchCode.trim()]).finally(() => {
      this.isLoading = false;
    });
  }

  private navigateToProduct(code: string) {
    this.router.navigate(['/product', code]);
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}