import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { warningOutline, trashOutline } from 'ionicons/icons';
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

  userAllergeni: string[] = ['Glutine', 'Soia'];

  prodotto: any;

dispensa: any[] = [
  { id: 1, nome: 'Pasta di Semola' },
  { id: 2, nome: 'Riso Arborio' }
];

alreadyInPantry(): boolean {
  if (!this.prodotto) return false;

  return this.dispensa.some(item => item.nome === this.prodotto.nome);
}


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
      additivi: [
        { nome: 'E300', pericolosita: 0 },
        { nome: 'E471', pericolosita: 2 }
      ],
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

  isUserAllergic(allergene: string): boolean {
    return this.userAllergeni.includes(allergene);
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
      <ion-title>Seleziona pasto, data e quantità</ion-title>
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

    <ion-item class="ion-margin-top">
      <ion-label position="stacked">Quantità (g)</ion-label>
      <ion-input type="number" [(ngModel)]="quantity" placeholder="Inserisci grammi"></ion-input>
    </ion-item>

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
    IonContent,
    IonInput
  ]
})
export class ModalMealDateComponent {
  meals: string[] = [];
  selectedMeal: string | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];
  quantity: number | null = null;

  private modalController = inject(ModalController);

  confirm() {
    this.modalController.dismiss({
      selectedMeal: this.selectedMeal,
      selectedDate: this.selectedDate,
      quantity: this.quantity
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
