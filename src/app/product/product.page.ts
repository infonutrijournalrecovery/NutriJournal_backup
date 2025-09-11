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
  IonItem,
  IonLabel,
  IonButton,
  IonList,
  IonSpinner,
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
          const data = res?.data;
          const p = (data && typeof data === 'object' && 'product' in data) ? (data as any).product : data;
          console.log('DEBUG prodotto ricevuto:', p);
          const nomeProdotto = p.name_it || p.name || '';
          if (!nomeProdotto) {
            this.showToast('Attenzione: il prodotto non ha un nome valido!');
          }
          if (p) {
            this.prodotto = {
              nome: nomeProdotto,
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
                      const code = codice.replace(/^[\w]+:/, '').toLowerCase();
                      return {
                        nome: code.toUpperCase() + (ADDITIVI_MAP[code] ? ' - ' + ADDITIVI_MAP[code] : '')
                      };
                    })
                    .filter((a: { nome: string }) => a.nome && a.nome.trim() !== '')
                : (typeof p.additives === 'string' ? p.additives.split(',')
                    .map((a: string) => {
                      const code = a.trim().replace(/^[\w]+:/, '').toLowerCase();
                      return {
                        nome: code.toUpperCase() + (ADDITIVI_MAP[code] ? ' - ' + ADDITIVI_MAP[code] : '')
                      };
                    })
                    .filter((a: { nome: string }) => a.nome && a.nome.trim() !== '') : []),
              allergeni: Array.isArray(p.allergens)
                ? p.allergens
                    .map((codice: string) => codice.replace(/^[\w]+:/, ''))
                    .filter((a: string) => a && a.trim() !== '')
                : (typeof p.allergens === 'string' ? p.allergens.split(',')
                    .map((a: string) => a.trim().replace(/^[\w]+:/, ''))
                    .filter((a: string) => a && a.trim() !== '') : [])
            };
            // Dopo aver caricato il prodotto, verifica se è già in dispensa tramite barcode (EAN) e status
            this.checkPantryStatusByBarcode(ean);
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

  /**
   * Controlla se il prodotto è in dispensa e con status 'available'
   */
  checkPantryStatusByBarcode(ean: string) {
    // Chiamata custom: recupera tutti gli item in dispensa con quel barcode
    // (deve essere implementata lato backend se non esiste)
    // Qui simuliamo con la chiamata già esistente, ma in futuro puoi fare una GET /api/pantry?barcode=...
    this.productService.checkProductInPantryByBarcode(ean).subscribe({
      next: (result: any) => {
        // Se il backend restituisce info dettagliate, controlla status
        // Qui assumiamo che result abbia un array di item o un campo status
        if (result && Array.isArray(result.items)) {
          // Cerca un item con status 'available'
          this.inPantry = result.items.some((item: any) => item.status === 'available');
        } else if (result && typeof result.inPantry !== 'undefined') {
          // Fallback: vecchia logica booleana
          this.inPantry = !!result.inPantry;
        } else {
          this.inPantry = false;
        }
      },
      error: () => {
        this.inPantry = false;
      }
    });
  // RIMOSSA GRAFFA IN PIU'
  }

  /** Aggiungi il prodotto in dispensa tramite barcode/EAN */
  addToPantry() {
    const ean = this.route.snapshot.paramMap.get('ean');
    // Ricava il nome prodotto dal backend prioritizzando name_it, poi name
    let nome = '';
    if (this.prodotto) {
      nome = this.prodotto.nome || this.prodotto.name || '';
    }
    const brand = this.prodotto?.marca || this.prodotto?.brand || '';
    if (!nome || nome.trim() === '') {
      this.showToast('Errore: il prodotto non ha un nome valido, impossibile aggiungere in dispensa.');
      return;
    }
    if (!brand || brand.trim() === '') {
      this.showToast('Errore: la marca è obbligatoria per aggiungere in dispensa.');
      return;
    }
    this.productService.checkProductInPantry(nome, brand).subscribe({
      next: (result) => {
        if (result.inPantry) {
          this.showToast('Errore: già presente in dispensa');
        } else {
          if (!ean) {
            this.showToast('EAN non valido');
            return;
          }
          const quantity = 1;
          const unit = 'pz';
          // Log per debug
          console.log('DEBUG: Chiamo addProductToPantryByBarcode con:', {ean, nome, quantity, unit, brand});
          this.productService.addProductToPantryByBarcode(ean, nome, quantity, unit, brand).subscribe({
            next: (res) => {
              if (res && res.success) {
                this.inPantry = true;
                this.showToast('Prodotto aggiunto correttamente in dispensa');
              } else {
                this.showToast("Errore durante l'aggiunta in dispensa");
              }
            },
            error: (err) => {
              if (err && err.error && err.error.message) {
                this.showToast(err.error.message);
              } else {
                this.showToast("Errore durante l'aggiunta in dispensa");
              }
            }
          });
        }
      },
      error: () => {
        this.showToast('Errore durante il controllo dispensa');
      }
    });
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
