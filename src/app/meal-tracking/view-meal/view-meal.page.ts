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
  buildNutrientiDinamici() {
    // Unisce i nutrienti principali e quelli extra in un array per la view
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
      if (this.prodotto[key] != null) {
        nutrienti.push({ nome: labels[key] || key, valore: this.prodotto[key], unita: unita[key] });
      }
    }
    // Extra
    let extra = {};
    if (this.prodotto.extra_nutrients) {
      try {
        extra = JSON.parse(this.prodotto.extra_nutrients);
      } catch {}
    }
    for (const [k, v] of Object.entries(extra)) {
      if (v != null) {
        nutrienti.push({ nome: labels[k] || k.charAt(0).toUpperCase() + k.slice(1), valore: v, unita: unita[k] });
      }
    }
    this.nutrientiDinamici = nutrienti;
  }
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);

  userAllergeni: string[] = ['Glutine', 'Soia'];

  prodotto: any = null;
  prodotti: any[] = [];
  dispensa: any[] = [
    { id: 1, nome: 'Pasta di Semola' },
    { id: 2, nome: 'Riso Arborio' }
  ];
  nutrientiDinamici: Array<{ nome: string, valore: any, unita?: string }> = [];
  

  meals: string[] = ['Colazione', 'Pranzo', 'Cena', 'Spuntino'];
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
      // Carica i pasti per la data selezionata
      const mealsRes: any = await this.apiService.getMealsByDateGrouped(this.selectedDate).toPromise();
      const mealsByType = mealsRes?.mealsByType || mealsRes?.data?.mealsByType || {};
      const mealArr = mealsByType[this.selectedMeal] || [];
      // Prendi il primo pasto del tipo richiesto (o gestisci se ce ne sono più di uno)
      const meal = mealArr.length > 0 ? mealArr[0] : null;
      if (!meal) {
        await this.showToast('Nessun pasto trovato per questo tipo');
        return;
      }
      this.prodotto = {
        nome: this.selectedDate,
        marca: this.getMealName(this.selectedMeal),
        quantita: '',
        allergeni: [],
        ...meal,
      };
      // Popola prodotti (items)
      this.prodotti = Array.isArray(meal.items) ? meal.items.map((item: any) => ({
        nome: item.product_name || item.nome || '',
        marca: item.brand || item.marca || '',
        quantita: item.quantity || item.quantita || '',
        note: item.note || '',
        nutrienti: item.nutrienti || item.nutrients || [],
      })) : [];
      // Costruisci nutrienti dinamici
      this.buildNutrientiDinamiciFromMeal(meal);
    } catch (err) {
      await this.showToast('Errore nel caricamento del pasto');
      console.error(err);
    }
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

  alreadyInPantry(): boolean {
    if (!this.prodotto) return false;
    return this.dispensa.some(item => item.nome === this.prodotto.nome);
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
    // Prendi il goal utente se disponibile
    const userGoals = (this.prodotto && this.prodotto.userGoals) ? this.prodotto.userGoals : null;
    // Fallback: cerca nei dati del pasto
    const fallbackGoals = {
      calories: this.prodotto?.calories_goal || 2000,
      carbs: this.prodotto?.carbs_goal || 250,
      proteins: this.prodotto?.proteins_goal || 90,
      fats: this.prodotto?.fats_goal || 70
    };
    const goals = userGoals || fallbackGoals;
    const base = goals[macro] || 100;
    const max = Math.round(base * (dist[macro] || 0.25));
    return max > 0 ? max : 100;
  }
}