import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonDatetime
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-date-picker-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Seleziona Data</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Chiudi</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="calendar-modal-wrapper">
        <ion-datetime
          [value]="date"
          [max]="max"
          presentation="date"
          (ionChange)="onDateChange($event)">
        </ion-datetime>
        <ion-button expand="block" (click)="confirm()">Conferma</ion-button>
      </div>
    </ion-content>
  `,
  styleUrls: ['./date-picker-modal.component.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    // Required Ionic modules for modal content
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonDatetime,
  ]
})
export class DatePickerModalComponent {
  @Input() date: string = new Date().toISOString();
  @Input() max: string = new Date().toISOString();
  selectedDate: string = this.date;

  constructor(private modalCtrl: ModalController) {}

  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
  }

  confirm() {
    this.modalCtrl.dismiss(this.selectedDate);
  }

  dismiss() {
    this.modalCtrl.dismiss(null);
  }
}
