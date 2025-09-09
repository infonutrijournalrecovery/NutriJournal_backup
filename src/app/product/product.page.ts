// Mappa codici additivi a nomi leggibili (puoi espandere la lista)
const ADDITIVI_MAP: Record<string, string> = {
  'e330': 'Acido citrico',
  'e202': 'Sorbato di potassio',
  'e300': 'Acido ascorbico',
  'e200': 'Acido sorbico',
  'e220': 'Anidride solforosa',
  'e250': 'Nitrito di sodio',
  'e251': 'Nitrato di sodio',
  'e160a': 'Carotene',
  'e322': 'Lecitina',
  'e410': 'Farina di semi di carrube',
  'e412': 'Gomma di guar',
  'e415': 'Gomma di xantano',
  'e440': 'Pectina',
  'e471': 'Mono- e digliceridi degli acidi grassi',
  'e472e': 'Estere diacilico degli acidi grassi',
  'e621': 'Glutammato monosodico',
  // ...altri codici se vuoi
};

import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../shared/services/product.service';
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
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  isDesktop = false;
  isMobile = false;


prodotto: any;
userAllergeni: string[] = [];
meals: string[] = ['Colazione', 'Pranzo', 'Cena', 'Spuntino'];
selectedMeal: string | null = null;
selectedDate: string = new Date().toISOString().split('T')[0];
inPantry: boolean = false;

constructor() {
  this.isDesktop = this.deviceService.isDesktop();
  this.isMobile = this.deviceService.isMobile();
}

  ngOnInit() {
    const ean = this.route.snapshot.paramMap.get('ean');
    if (ean) {
      this.productService.getProductByBarcode(ean).subscribe({
        next: (res) => {
          // Supporta sia risposta backend custom che OpenFoodFacts
          // Supporta sia risposta backend custom che OpenFoodFacts
          const data = res?.data;
          // Se data ha la proprietà 'product', usa quella, altrimenti usa data stesso
          const p = (data && typeof data === 'object' && 'product' in data) ? (data as any).product : data;
          if (p) {
            // Mapping leggibile per template, compatibile con risposta backend
            this.prodotto = {
              nome: p.name_it || p.name || '',
              marca: p.brand || '',
              quantita: p.serving?.size || '',
              nutrienti: p.nutrition_per_100g ? {
                energia: p.nutrition_per_100g.calories || '',
                carboidrati: p.nutrition_per_100g.carbohydrates || '',
                grassi: p.nutrition_per_100g.fats || '',
                proteine: p.nutrition_per_100g.proteins || '',
                sale: p.nutrition_per_100g.sodium || '',
                zuccheri: p.nutrition_per_100g.sugars || '',
                fibre: p.nutrition_per_100g.fiber || ''
              } : {},
              additivi: Array.isArray(p.additives)
                ? p.additives
                    .map((codice: string) => {
                      const code = codice.replace(/^\w+:/, '').toLowerCase();
                      return {
                        nome: code.toUpperCase() + (ADDITIVI_MAP[code] ? ' - ' + ADDITIVI_MAP[code] : '')
                      };
                    })
                    .filter((a: { nome: string }) => a.nome && a.nome.trim() !== '')
                : (typeof p.additives === 'string' ? p.additives.split(',')
                    .map((a: string) => {
                      const code = a.trim().replace(/^\w+:/, '').toLowerCase();
                      return {
                        nome: code.toUpperCase() + (ADDITIVI_MAP[code] ? ' - ' + ADDITIVI_MAP[code] : '')
                      };
                    })
                    .filter((a: { nome: string }) => a.nome && a.nome.trim() !== '') : []),
              allergeni: Array.isArray(p.allergens)
                ? p.allergens
                    .map((codice: string) => codice.replace(/^\w+:/, ''))
                    .filter((a: string) => a && a.trim() !== '')
                : (typeof p.allergens === 'string' ? p.allergens.split(',')
                    .map((a: string) => a.trim().replace(/^\w+:/, ''))
                    .filter((a: string) => a && a.trim() !== '') : [])
            };
            // Dopo aver caricato il prodotto, verifica se è già in dispensa SOLO se nome e marca sono valorizzati
            if (this.prodotto.nome && this.prodotto.marca) {
              this.productService.checkProductInPantry(this.prodotto.nome, this.prodotto.marca).subscribe({
                next: (result) => {
                  this.inPantry = !!result.inPantry;
                },
                error: () => {
                  this.inPantry = false;
                }
              });
            } else {
              this.inPantry = false;
            }
          } else {
            this.prodotto = null;
            this.showToast('Prodotto non trovato');
          }
        },
        error: (err) => {
          this.prodotto = null;
          this.showToast('Errore nel recupero del prodotto');
        }
      });
    } else {
      this.prodotto = null;
      this.showToast('EAN non valido');
    }
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
