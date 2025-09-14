import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  ]
})
export class ViewMealPage {
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
  nutrientiDinamici: Array<{ nome: string, valore: any, unita?: string }> = [];
  

  meals: string[] = ['Colazione', 'Pranzo', 'Cena', 'Spuntino'];
  selectedMeal: string | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];



  constructor() {
      addIcons({trashOutline});}

  ngOnInit() {
    // prodotto di esempio
    this.prodotto = {
      nome: 'Lunedì 1 set 2025',
      marca: 'Pranzo',
      quantita: '500 g',
      allergeni: ['Glutine'],
      // Simula struttura reale: nutrienti principali + extra_nutrients JSON
      calories: 350,
      proteins: 12,
      carbs: 72,
      fats: 1.5,
      fiber: 3.0,
      extra_nutrients: JSON.stringify({
        zuccheri: 2.5,
        saturi: 0.3,
        sale: 0.01,
        vitaminaC: 12,
        potassio: 400
      })
    };
    this.buildNutrientiDinamici();
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