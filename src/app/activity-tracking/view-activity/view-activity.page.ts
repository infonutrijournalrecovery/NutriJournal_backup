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
  IonItem,
  IonLabel,
  IonList,
  IonButton,
  IonProgressBar,
} from '@ionic/angular/standalone';

import { 
  AlertController, 
  ToastController, 
  LoadingController, 
  ActionSheetController, 
  ModalController 
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import { personOutline, warningOutline, trashOutline } from 'ionicons/icons';

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
    IonItem,
    IonLabel,
    IonList,
    IonButton,
    IonProgressBar
  ],
  providers: [
    AlertController,
    ToastController,
    LoadingController,
    ActionSheetController,
    ModalController
  ]
})
export class ViewActivityPage {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);

  prodotto: any;
  nutrienti = [
    { nome: 'Resoconto Energetico', assunto: 200, obiettivo: 400, unita: 'kcal' },
  ];

  constructor() {
    // \U0001f511 Registrazione icone
    addIcons({trashOutline,warningOutline,personOutline});
  }

  ngOnInit() {
    this.prodotto = {
      nome: 'Lunedì 1 set 2025',
      marca: 'Corsa',
      quantita: '50 min',
    };
  }
}