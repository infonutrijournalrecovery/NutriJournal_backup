import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle, 
  IonCardContent,
  IonItem, 
  IonInput, 
  IonButton, 
  IonIcon,
  IonText,
  IonSpinner,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, checkmarkCircleOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner
  ]
})
export class ForgotPasswordPage implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  emailSent = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ mailOutline, checkmarkCircleOutline, lockClosedOutline });
    
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
  }

  /**
   * Gestisce l'invio della richiesta di reset password
   */
  async onSubmit() {
    if (this.forgotPasswordForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Invio in corso...',
        spinner: 'crescent'
      });
      await loading.present();

      this.isLoading = true;
      const email = this.forgotPasswordForm.value.email;

      this.authService.forgotPassword(email).subscribe({
        next: async (response) => {
          await loading.dismiss();
          this.isLoading = false;
          if (response.success) {
            this.emailSent = true;
            await this.showToast('Email di recupero inviata con successo!', 'success');
          } else {
            await this.showToast(response.message || 'Errore durante l\'invio', 'danger');
          }
        },
        error: async (error) => {
          await loading.dismiss();
          this.isLoading = false;
          await this.showToast('Errore durante l\'invio. Riprova.', 'danger');
          console.error('Forgot password error:', error);
        }
      });
    } else {
      await this.showToast('Inserisci un indirizzo email valido', 'warning');
    }
  }

  /**
   * Naviga al login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Mostra toast message
   */
  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Gestione errori dei campi
   */
  getFieldError(fieldName: string): string {
    const field = this.forgotPasswordForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Email è obbligatoria';
      }
      if (field.errors['email']) {
        return 'Inserisci un indirizzo email valido';
      }
    }
    return '';
  }

  /**
   * Controlla se il campo ha errori
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}
