import { Component, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
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
  IonButton,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonModal,        // \U0001f448 IMPORTA IonModal
  IonDatetime      // \U0001f448 IMPORTA IonDatetime
} from '@ionic/angular/standalone';

import { DeviceService } from '../shared/services/device.service';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-vals',
  templateUrl: './vals.page.html',
  styleUrls: ['./vals.page.scss'],
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
    IonButton,
    IonList,
    IonGrid,
    IonRow,
    IonCol,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonModal,        // \U0001f448 AGGIUNGI QUI
    IonDatetime      // \U0001f448 AGGIUNGI QUI
  ]
})
export class ValsPage implements AfterViewInit {
  private deviceService = inject(DeviceService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  @ViewChild('lineCanvas') lineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dateModal') dateModal!: any; // \U0001f448 riferimento al modal

  lineChart: any;
  selectedRange: string = 'settimanale';

  selectedDate: string = new Date().toISOString(); // \U0001f448 data selezionata

  isDesktop = false;
  isMobile = false;

  menuItems = [
    { title: 'Peso' },
    { title: 'Calorie' },
    { title: 'Proteine' },
    { title: 'Carboidrati' },
    { title: 'Grassi' },
    { title: 'Acqua' },
  ];

  constructor() {
    this.isDesktop = this.deviceService.isDesktop();
    this.isMobile = this.deviceService.isMobile();
  }

  ngAfterViewInit() {
    this.createChart();
  }

  createChart() {
    const data = {
      labels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
      datasets: [
        {
          label: 'Peso',
          data: [70, 71, 70.5, 70.8, 70.3, 70, 69.8],
          borderColor: 'rgba(33, 150, 243, 1)',
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          fill: false,
        },
        {
          label: 'Calorie',
          data: [2000, 2100, 1900, 2200, 2050, 2000, 1950],
          borderColor: 'rgba(244, 67, 54, 1)',
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          fill: false,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'bottom' as const },
      },
    };

    if (this.lineChart) {
      this.lineChart.destroy();
    }

    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      data,
      options,
    });
  }

  async openDateModal() {
    await this.dateModal.present();
  }

  async closeDateModal(confirm = false) {
    if (confirm) {
      // Qui potresti fare eventuale logica extra con la data selezionata
    }
    await this.dateModal.dismiss();
  }

  formatDate(dateString: string): string {
    const d = new Date(dateString);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
