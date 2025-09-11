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
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonProgressBar,
  IonIcon
} from '@ionic/angular/standalone';
import { AlertController, ToastController, LoadingController, ActionSheetController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-view-meal',
  templateUrl: './view-meal.page.html',
  styleUrls: ['./view-meal.page.scss'],
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
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonProgressBar,
  IonIcon
  ]
})
export class ViewMealPage {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);

  userAllergeni: string[] = ['Glutine', 'Soia'];

  prodotto: any;

  prodotti: any[] = [];

  dispensa: any[] = [
    { id: 1, nome: 'Pasta di Semola' },
    { id: 2, nome: 'Riso Arborio' }
  ];

  nutrienti = [
    { nome: 'Energia', assunto: 200, obiettivo: 400, unita: 'kcal' },
    { nome: 'Carboidrati', assunto: 400, obiettivo: 200, unita: 'g' },
    { nome: 'Grassi', assunto: 50, obiettivo: 70, unita: 'g' },
    { nome: 'Proteine', assunto: 30, obiettivo: 50, unita: 'g' },
    { nome: 'Sale', assunto: 3, obiettivo: 5, unita: 'g' }
  ];
  

  meals: string[] = ['Colazione', 'Pranzo', 'Cena', 'Spuntino'];
  selectedMeal: string | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];

  ngOnInit() {
    // prodotto di esempio
    this.prodotto = {
      nome: 'Lunedì 1 set 2025',
      marca: 'Pranzo',
      quantita: '500 g',
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

    this.loadProducts();
  }

  // lista dinamica di prodotti
  loadProducts() {
    this.prodotti = [
      { nome: 'Pasta di Semola', marca: 'Barilla', quantita: '150 g', note: '' },
      { nome: 'Riso Arborio', marca: 'Scotti', quantita: '80 g', note: '' },
      { nome: 'Farina 00', marca: 'Caputo', quantita: '30 g', note: '' }
    ];
  }

  goToProduct(prod: any) {
    this.router.navigate(['/product']);
  }

  removeProduct(prod: any) {
    this.prodotti = this.prodotti.filter(p => p !== prod);
    console.log('Rimosso prodotto:', prod.nome);
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


  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  }

  alreadyInPantry(): boolean {
    if (!this.prodotto) return false;
    return this.dispensa.some(item => item.nome === this.prodotto.nome);
  }
}

