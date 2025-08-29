import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle, 
  IonCardContent,
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton, 
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonToast,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
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
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline });
    
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Se l'utente è già autenticato, reindirizza alla dashboard
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/tabs/dashboard']);
    }
  }

  /**
   * Toggle visibilità password
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Gestisce il login
   */
  async onLogin() {
    if (this.loginForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Accesso in corso...',
        spinner: 'crescent'
      });
      await loading.present();

      this.isLoading = true;
      
      const credentials = this.loginForm.value;
      
      this.authService.login(credentials).subscribe({
        next: async (response) => {
          await loading.dismiss();
          this.isLoading = false;
          
          if (response.success) {
            await this.showToast('Accesso effettuato con successo!', 'success');
            this.router.navigate(['/tabs/dashboard']);
          } else {
            await this.showToast(response.message || 'Credenziali non valide', 'danger');
          }
        },
        error: async (error) => {
          await loading.dismiss();
          this.isLoading = false;
          await this.showToast('Errore durante l\'accesso. Riprova.', 'danger');
          console.error('Login error:', error);
        }
      });
    } else {
      await this.showToast('Compila tutti i campi correttamente', 'warning');
    }
  }

  /**
   * Naviga alla registrazione
   */
  goToRegister() {
    this.router.navigate(['/register']);
  }

  /**
   * Naviga al recupero password
   */
  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
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
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'Email' : 'Password'} è obbligatorio`;
      }
      if (field.errors['email']) {
        return 'Inserisci un indirizzo email valido';
      }
      if (field.errors['minlength']) {
        return 'Password deve essere di almeno 6 caratteri';
      }
    }
    return '';
  }

  /**
   * Controlla se il campo ha errori
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}
