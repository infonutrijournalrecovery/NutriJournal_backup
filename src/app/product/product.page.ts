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

  import { ApiService } from '../shared/services/api.service';

// Mappa allergeni inglese → italiano
const ALLERGENI_MAP: Record<string, string> = {
  'nuts': 'Frutta a guscio',
  'milk': 'Latte',
  'egg': 'Uovo',
  'soybeans': 'Soia',
  'peanuts': 'Arachidi',
  'gluten': 'Glutine',
  'fish': 'Pesce',
  'crustaceans': 'Crostacei',
  'molluscs': 'Molluschi',
  'sesame': 'Sesamo',
  'mustard': 'Senape',
  'celery': 'Sedano',
  'lupin': 'Lupino',
  'sulphur-dioxide': 'Anidride solforosa',
  'wheat': 'Frumento',
  'barley': 'Orzo',
  'rye': 'Segale',
  'oats': 'Avena',
  'hazelnuts': 'Nocciole',
  'almonds': 'Mandorle',
  'walnuts': 'Noci',
  'cashews': 'Anacardi',
  'pistachios': 'Pistacchi',
  'pecans': 'Noci pecan',
  'macadamia': 'Noci macadamia',
  'brazil-nuts': 'Noci del Brasile',
  'shellfish': 'Crostacei',
  'shrimp': 'Gamberi',
  'scallops': 'Capesante',
  'clams': 'Vongole',
  'mussels': 'Cozze',
  'octopus': 'Polpo',
  'squid': 'Calamaro',
  'corn': 'Mais',
  'chicken': 'Pollo',
  'beef': 'Manzo',
  'pork': 'Maiale',
  'turkey': 'Tacchino',
  'fruit': 'Frutta',
  'vegetables': 'Verdure',
  'legumes': 'Legumi',
  'sesame-seeds': 'Semi di sesamo',
  'sunflower-seeds': 'Semi di girasole',
  'mustard-seeds': 'Semi di senape',
  'sulphites': 'Solfiti',
  'yeast': 'Lievito',
  // altri comuni
};

import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService, normalizeProduct } from '../shared/services/product.service';
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
    IonSpinner
  ]
})
export class ProductPage {
  /**
   * Restituisce la lista di allergeni/additivi pericolosi per l'utente (nome in italiano)
   */
  getDangerousIngredients(): string[] {
    const pericolosi: string[] = [];
    if (this.prodotto) {
      // Debug allergeni
      console.log('DEBUG allergeni prodotto:', this.prodotto.allergeni);
      console.log('DEBUG userAllergeni:', this.userAllergeni);
      if (Array.isArray(this.prodotto.allergeni)) {
        pericolosi.push(...this.prodotto.allergeni.filter((a: { nome: string; key: string; isUserAllergic: boolean }) => a.isUserAllergic).map((a: { nome: string }) => a.nome));
      }
      // Debug additivi
      console.log('DEBUG additivi prodotto:', this.prodotto.additivi);
      console.log('DEBUG userAdditivi:', this.userAdditivi);
      if (Array.isArray(this.prodotto.additivi)) {
        pericolosi.push(...this.prodotto.additivi.filter((a: { nome: string; pericolosita: number; isUserSensitive?: boolean; code?: string }) => a.isUserSensitive).map((a: { nome: string }) => a.nome));
      }
    }
    console.log('DEBUG ingredienti pericolosi:', pericolosi);
    return pericolosi;
  }
  isDesktop: boolean;
  isMobile: boolean;
  prodotto: any = null;
  productQuantity: number | null = null; // Quantità del prodotto (dal JSON API esterna)
  userAllergeni: string[] = [];
  userAdditivi: any[] = [];
  meals: string[] = ['Colazione', 'Pranzo', 'Cena', 'Spuntino'];
  selectedMeal: string | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];
  inPantry: boolean = false;
  consumedQuantity: number | null = null; // Quantità consumata dall'utente

  constructor(
    private deviceService: DeviceService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    private route: ActivatedRoute,
    private productService: ProductService,
    private apiService: ApiService
  ) {
    this.isDesktop = this.deviceService.isDesktop();
    this.isMobile = this.deviceService.isMobile();
  }

  ngOnInit() {
    // Recupera allergeni/additivi utente
    this.apiService.getUserAllergies().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          // Estrai solo i codici degli allergeni
          this.userAllergeni = Array.isArray(res.data)
            ? res.data.map((a: any) => (a.allergen_code || a.code || '').toLowerCase())
            : [];
        }
      }
    });
    this.apiService.getUserAdditives().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          // Estrai solo i codici degli additivi
          this.userAdditivi = Array.isArray(res.data)
            ? res.data.map((a: any) => (a.additive_code || a.code || '').toLowerCase())
            : [];
        }
      }
    });

    const ean = this.route.snapshot.paramMap.get('ean');
    if (ean) {
      this.productService.getProductByBarcode(ean).subscribe({
        next: (res) => {
          const data = res?.data;
          const p = (data && typeof data === 'object' && 'product' in data) ? (data as any).product : data;
          console.log('DEBUG prodotto ricevuto:', p);
          const normalized = normalizeProduct(p);
          // Estrai quantità prodotto dal JSON API esterna (es. open food facts)
          // Ad esempio: p.quantity, p.net_weight, p.serving_size, ecc.
          this.productQuantity = p.quantity || p.net_weight || p.serving_size || null;

          // Trasforma additivi: da codici a oggetti { nome, pericolosita, isUserSensitive }
          if (Array.isArray(normalized.additives)) {
            normalized.additivi = normalized.additives.map((code: string) => {
              const nome = ADDITIVI_MAP[code.toLowerCase()] || code;
              let pericolosita = 0;
              if (["e220","e250","e251","e621"].includes(code.toLowerCase())) pericolosita = 2;
              else if (["e202","e330","e472e"].includes(code.toLowerCase())) pericolosita = 1;
              // Segnala se l'utente è sensibile
              const isUserSensitive = this.userAdditivi.includes(code.toLowerCase());
              return { nome, pericolosita, isUserSensitive, code: code.toLowerCase() };
            });
          } else {
            normalized.additivi = [];
          }

          // Trasforma allergeni: rimuovi prefisso lingua e traduci in italiano se presente, aggiungi flag isUserAllergic
          normalized.allergeni = Array.isArray(normalized.allergens)
            ? normalized.allergens.map((a: string) => {
                const key = a.replace(/^[a-z]{2}:/, '').trim().toLowerCase();
                const nome = ALLERGENI_MAP[key] || key;
                // Confronta con array di codici estratti
                const isUserAllergic = this.userAllergeni.includes(key);
                return { nome, key, isUserAllergic };
              })
            : (normalized.allergens
                ? String(normalized.allergens)
                    .split(',')
                    .map((a: string) => {
                      const key = a.replace(/^[a-z]{2}:/, '').trim().toLowerCase();
                      const nome = ALLERGENI_MAP[key] || key;
                      const isUserAllergic = this.userAllergeni.includes(key);
                      return { nome, key, isUserAllergic };
                    })
                : []);
          if (!normalized.name) {
            this.showToast('Attenzione: il prodotto non ha un nome valido!');
          }
          if (normalized) {
            this.prodotto = normalized;
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

  // Deprecated: la logica ora è nel template tramite allergene.isUserAllergic
  isUserAllergic(_allergene: any): boolean {
    return false;
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
  <ion-input type="number" [(ngModel)]="consumedQuantity" placeholder="Inserisci grammi"></ion-input>
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
  consumedQuantity: number | null = null; // Quantità consumata dall'utente

  private modalController = inject(ModalController);

  confirm() {
    this.modalController.dismiss({
      selectedMeal: this.selectedMeal,
      selectedDate: this.selectedDate,
      consumedQuantity: this.consumedQuantity
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
