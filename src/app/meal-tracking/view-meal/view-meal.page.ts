import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { warningOutline, trashOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote, IonProgressBar } from '@ionic/angular/standalone';
import { AlertController, ToastController, LoadingController, ActionSheetController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-view-meal',
  templateUrl: './view-meal.page.html',
  styleUrls: ['./view-meal.page.scss'],
  standalone: true,
  imports: [IonProgressBar, 
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote
  ],
  providers: [ModalController]
})
export class ViewMealPage implements OnInit {
  dataPasto: string = '';
  tipoPasto: string = '';
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);

  userAllergeni: string[] = ['Glutine', 'Soia'];

  prodotti: any[] = [];
  nutrientiDinamici: Array<{ nome: string, valore: any, unita?: string }> = [];
  selectedMeal: string | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];




  constructor() {
      addIcons({trashOutline});
  }

  // Restituisce la label italiana per il tipo di pasto
  getMealName(mealType: string): string {
    switch (mealType) {
      case 'breakfast': return 'Colazione';
      case 'lunch': return 'Pranzo';
      case 'snack': return 'Spuntino';
      case 'dinner': return 'Cena';
      default: return mealType;
    }
  }

  async ngOnInit() {
    // Leggi il tipo di pasto dalla route
    const mealType = this.route.snapshot.paramMap.get('type');
    this.selectedMeal = mealType ? mealType : null;
    this.tipoPasto = this.selectedMeal || '';
    // Leggi la data dai query param (es: /view-meal/:type?date=YYYY-MM-DD)
    const queryDate = this.route.snapshot.queryParamMap.get('date');
    this.selectedDate = queryDate ? queryDate : new Date().toISOString().split('T')[0];
    this.dataPasto = this.selectedDate;

    if (!this.selectedMeal) {
      await this.showToast('Tipo di pasto non specificato');
      return;
    }

    try {
      // Carica i pasti raggruppati per tipo
      const mealsRes: any = await this.apiService.getMealsByDateGrouped(this.selectedDate).toPromise();
      const mealsByType = mealsRes?.mealsByType || mealsRes?.data?.mealsByType || {};
      // Prendi solo i prodotti del tipo selezionato
      const mealArr = mealsByType[this.selectedMeal] || [];
      if (!mealArr.length) {
        await this.showToast('Nessun pasto trovato per questo tipo');
        this.prodotti = [];
        this.nutrientiDinamici = [];
        return;
      }
      // Unisci tutti gli items dei pasti di quel tipo (se ce ne sono più di uno)
      this.prodotti = mealArr.flatMap((meal: any) => Array.isArray(meal.items) ? meal.items.map((item: any) => ({
        nome: item.product?.display_name || item.product?.name_it || item.product?.name || item.product_name || item.nome || '',
        marca: item.product?.brand || item.brand || item.marca || '',
        quantita: item.quantity || item.quantita || '',
        note: item.note || '',
        nutrienti: item.nutrienti || item.nutrients || this.extractNutrientiFromItem(item),
      })) : []);
      // Somma i nutrienti di tutti i prodotti per il resoconto totale
      this.nutrientiDinamici = this.sommaNutrienti(this.prodotti);
    } catch (err) {
      await this.showToast('Errore nel caricamento del pasto');
      this.prodotti = [];
      this.nutrientiDinamici = [];
      console.error(err);
    }
  }

  // Somma i nutrienti di tutti i prodotti per il resoconto totale
  sommaNutrienti(prodotti: any[]): Array<{ nome: string, valore: any, unita?: string }> {
    const totali: { [nome: string]: { valore: number, unita?: string } } = {};
    for (const prod of prodotti) {
      if (Array.isArray(prod.nutrienti)) {
        for (const n of prod.nutrienti) {
          if (!totali[n.nome]) {
            totali[n.nome] = { valore: 0, unita: n.unita };
          }
          totali[n.nome].valore += Number(n.valore) || 0;
        }
      }
    }
    return Object.entries(totali).map(([nome, obj]) => ({ nome, valore: obj.valore, unita: obj.unita }));
  }

  // Estrae i nutrienti da un item se non già presenti (fallback)
  extractNutrientiFromItem(item: any): any[] {
    const result: any[] = [];
    if (!item) return result;
    // Cerca proprietà note di nutrienti
    const keys = ['calories','carbs','fats','proteins','fiber','sale','zuccheri','saturi','vitaminaC','potassio'];
    const labels: Record<string, string> = {
      calories: 'Energia',
      proteins: 'Proteine',
      carbs: 'Carboidrati',
      fats: 'Grassi',
      fiber: 'Fibre',
      sale: 'Sale',
      zuccheri: 'Zuccheri',
      saturi: 'Grassi saturi',
      vitaminaC: 'Vitamina C',
      potassio: 'Potassio',
    };
    const unita: Record<string, string> = {
      calories: 'kcal',
      proteins: 'g',
      carbs: 'g',
      fats: 'g',
      fiber: 'g',
      sale: 'g',
      zuccheri: 'g',
      saturi: 'g',
      vitaminaC: 'mg',
      potassio: 'mg',
    };
    for (const k of keys) {
      if (item[k] != null) {
        result.push({ nome: labels[k] || k, valore: item[k], unita: unita[k] });
      }
    }
    // Extra micronutrienti
    if (item.extra_nutrients) {
      try {
        const extra = typeof item.extra_nutrients === 'string' ? JSON.parse(item.extra_nutrients) : item.extra_nutrients;
        for (const [k, v] of Object.entries(extra)) {
          if (v != null) {
            result.push({ nome: labels[k] || k.charAt(0).toUpperCase() + k.slice(1), valore: v, unita: unita[k] });
          }
        }
      } catch {}
    }
    return result;
  }

  // Costruisce nutrienti dinamici da un oggetto meal
  buildNutrientiDinamiciFromMeal(meal: any) {
    const labels: Record<string, string> = {
      calories: 'Energia',
      proteins: 'Proteine',
      carbs: 'Carboidrati',
      fats: 'Grassi',
      fiber: 'Fibre',
      // aggiungi qui altre label se vuoi
    };
    const unita: Record<string, string> = {
      calories: 'kcal',
      proteins: 'g',
      carbs: 'g',
      fats: 'g',
      fiber: 'g',
      sale: 'g',
      zuccheri: 'g',
      saturi: 'g',
      vitaminaC: 'mg',
      potassio: 'mg',
    };
    const nutrienti: Array<{ nome: string, valore: any, unita?: string }> = [];
    // Principali
    for (const key of ['calories','carbs','fats','proteins','fiber']) {
      if (meal[key] != null) {
        nutrienti.push({ nome: labels[key] || key, valore: meal[key], unita: unita[key] });
      }
    }
    // Extra
    let extra = {};
    if (meal.extra_nutrients) {
      try {
        extra = typeof meal.extra_nutrients === 'string' ? JSON.parse(meal.extra_nutrients) : meal.extra_nutrients;
      } catch {}
    }
    for (const [k, v] of Object.entries(extra)) {
      if (v != null) {
        nutrienti.push({ nome: labels[k] || k.charAt(0).toUpperCase() + k.slice(1), valore: v, unita: unita[k] });
      }
    }
    this.nutrientiDinamici = nutrienti;
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


    // Calcola il massimo per la progress bar in base alla distribuzione e ai goal utente
  getProgressBarMax(nome: string): number {
    // Mappa inversa per trovare la chiave goal
    const macroMap: Record<string, string> = {
      'Energia': 'calories',
      'Carboidrati': 'carbs',
      'Proteine': 'proteins',
      'Grassi': 'fats'
    };
    const macro = macroMap[nome];
    if (!macro || !this.selectedMeal) return 100;
    // Distribuzione per tipo pasto (come in dashboard)
    const mealDistribution: any = {
      breakfast: { calories: 0.25, carbs: 0.30, proteins: 0.20, fats: 0.20 },
      lunch: { calories: 0.35, carbs: 0.40, proteins: 0.35, fats: 0.35 },
      snack: { calories: 0.15, carbs: 0.15, proteins: 0.15, fats: 0.15 },
      dinner: { calories: 0.25, carbs: 0.15, proteins: 0.30, fats: 0.30 }
    };
    // Normalizza il tipo pasto
    let mealType = this.selectedMeal.toLowerCase();
    if (mealType === 'colazione') mealType = 'breakfast';
    if (mealType === 'pranzo') mealType = 'lunch';
    if (mealType === 'spuntino' || mealType === 'spuntini') mealType = 'snack';
    if (mealType === 'cena') mealType = 'dinner';
    const dist = mealDistribution[mealType];
    if (!dist) return 100;
    // Usa solo valori di default per i goal
    const defaultGoals = {
      calories: 2000,
      carbs: 250,
      proteins: 90,
      fats: 70
    };
  const base = defaultGoals[macro as keyof typeof defaultGoals] || 100;
    const max = Math.round(base * (dist[macro] || 0.25));
    return max > 0 ? max : 100;
  }
}