import { Component, inject } from '@angular/core';
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
  IonList,
  IonAvatar,
  IonChip,
  IonSpinner,
  AlertController,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';

import { DeviceService } from '../shared/services/device.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
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
    IonList,
    IonAvatar,
    IonChip,
    IonSpinner,
  ]
})
export class ProductPage {
  private deviceService = inject(DeviceService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  isDesktop = false;
  isMobile = false;

  prodotto: any;
  

  // Lista di elementi (mock, poi li carichi dal DB)
  items = [
    { title: 'Pasta', description: 'Pacco da 500g', brand: 5 },
    { title: 'Riso', description: 'Riso basmati 1kg', brand: 3 },
    { title: 'Olio', description: 'Bottiglia 1L', brand: 1 },
    { title: 'Pane', description: 'Pan bauletto 500g', brand: 2 },
  ];


  constructor() {
    this.isDesktop = this.deviceService.isDesktop();
    this.isMobile = this.deviceService.isMobile();
  }

  async onButtonClick(item: any) {
    const alert = await this.alertController.create({
      header: 'Azione',
      message: `Hai cliccato su: <b>${item.title}</b>`,
      buttons: ['OK']
    });
    await alert.present();
  }

  ngOnInit() {
    // Esempio di caricamento dati (in un caso reale, useresti un service con HTTP)
    this.prodotto = {
      nome: 'Pasta di Semola',
      marca: 'Barilla',
      quantita: '500 g',
      additivi: ['E300', 'E471'],
      allergeni: ['Glutine'],
      nutrienti: {
        energia: 350,
        carboidrati: 72,
        zuccheri: 2.5,
        grassi: 1.5,
        saturi: 0.3,
        proteine: 12,
        fibre: 3.0,
        sale: 0.01
      }
    };
  }
}
