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

// import { DeviceService } from '../shared/services/device.service';

@Component({
  selector: 'app-view-activity',
  templateUrl: './view-activity.page.html',
  styleUrls: ['./view-activity.page.scss'],
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
export class ViewActivityPage {
//  private deviceService = inject(DeviceService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  isDesktop = false;
  isMobile = false;

  // Lista di elementi (mock, poi li carichi dal DB)
  items = [
    { title: 'Pasta', description: 'Pacco da 500g', brand: 5 },
    { title: 'Riso', description: 'Riso basmati 1kg', brand: 3 },
    { title: 'Olio', description: 'Bottiglia 1L', brand: 1 },
    { title: 'Pane', description: 'Pan bauletto 500g', brand: 2 },
  ];


  constructor() {
    //this.isDesktop = this.deviceService.isDesktop();
    //this.isMobile = this.deviceService.isMobile();
  }

  async onButtonClick(item: any) {
    const alert = await this.alertController.create({
      header: 'Azione',
      message: `Hai cliccato su: <b>${item.title}</b>`,
      buttons: ['OK']
    });
    await alert.present();
  }
}
