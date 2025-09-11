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
  IonProgressBar,
  IonNote
} from '@ionic/angular/standalone';

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
    IonProgressBar
  ]
})
export class ViewActivityPage {
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
    { nome: 'Resoconto Energetico', assunto: 200, obiettivo: 400, unita: 'kcal' },
  ];
  

  activitys: string[] = ['Colazione', 'Pranzo', 'Cena', 'Spuntino'];
  selectedactivity: string | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];

  ngOnInit() {
    // prodotto di esempio
    this.prodotto = {
      nome: 'Lunedì 1 set 2025',
      marca: 'Corsa',
      quantita: '50 min',
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

}

