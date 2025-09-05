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
  ActionSheetController,
  ModalController,
  IonRadioGroup,
  IonRadio,
  IonDatetime,
  
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
    IonRadioGroup,
    IonRadio,
    IonDatetime,
  ]
})
export class ProductPage {
  private deviceService = inject(DeviceService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);

  isDesktop = false;
  isMobile = false;

  prodotto: any;

  meals: string[] = ['Colazione', 'Pranzo', 'Cena', 'Spuntino'];
  selectedMeal: string | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];

  constructor() {
    this.isDesktop = this.deviceService.isDesktop();
    this.isMobile = this.deviceService.isMobile();
  }

  ngOnInit() {
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

  async onButtonClick(item: any) {
    const alert = await this.alertController.create({
      header: 'Azione',
      message: `Hai cliccato su: <b>${item.title}</b>`,
      buttons: ['OK']
    });
    await alert.present();
  }

  /** Apri il Modal con pasto + calendario */
  async openMealActionSheet() {
    const modal = await this.modalController.create({
      component: ModalMealDateComponent,
      componentProps: {
        meals: this.meals,
        selectedMeal: this.selectedMeal,
        selectedDate: this.selectedDate
      }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.selectedMeal = data.selectedMeal;
      this.selectedDate = data.selectedDate;
      this.showToast(`Hai selezionato ${this.selectedMeal} del ${this.selectedDate}`);
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  }
}

/** Componente standalone per il Modal */
@Component({
  selector: 'app-modal-meal-date',
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title>Seleziona pasto e data</ion-title>
      <ion-buttons slot="end">
        <ion-button (click)="dismiss()">Annulla</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <ion-label>Pasto</ion-label>
    <ion-radio-group [(ngModel)]="selectedMeal">
      <ion-item *ngFor="let meal of meals">
        <ion-label>{{ meal }}</ion-label>
        <ion-radio slot="start" [value]="meal"></ion-radio>
      </ion-item>
    </ion-radio-group>

    <ion-label class="ion-margin-top">Data</ion-label>
    <ion-datetime [(ngModel)]="selectedDate" displayFormat="DD/MM/YYYY" pickerFormat="DD/MM/YYYY" presentation="date"></ion-datetime>

    <ion-button expand="full" class="ion-margin-top" (click)="confirm()">Conferma</ion-button>
  </ion-content>
  `,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonItem,
    IonLabel,
    IonRadio,
    IonRadioGroup,
    IonDatetime,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent
  ]
})
export class ModalMealDateComponent {
  meals: string[] = [];
  selectedMeal: string | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];

  private modalController = inject(ModalController);

  confirm() {
    this.modalController.dismiss({
      selectedMeal: this.selectedMeal,
      selectedDate: this.selectedDate
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
