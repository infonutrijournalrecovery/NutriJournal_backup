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
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, 
  mailOutline, 
  lockClosedOutline, 
  eyeOutline, 
  eyeOffOutline,
  calendarOutline,
  manOutline,
  womanOutline,
  resizeOutline,
  scaleOutline,
  arrowBackOutline, fitnessOutline, trendingUpOutline } from 'ionicons/icons';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonSpinner,
    IonSelect,
    IonSelectOption
  ]
})
export class RegisterPage implements OnInit {

  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  maxDate = new Date().toISOString();

  genderOptions = [
    { value: 'male', label: 'Maschio', icon: 'man-outline' },
    { value: 'female', label: 'Femmina', icon: 'woman-outline' },
    { value: 'other', label: 'Altro', icon: 'person-outline' }
  ];

  activityLevels = [
    { value: 'sedentary', label: 'Sedentario', description: 'Poco o nessun esercizio' },
    { value: 'light', label: 'Leggero', description: '1-3 giorni a settimana' },
    { value: 'moderate', label: 'Moderato', description: '3-5 giorni a settimana' },
    { value: 'active', label: 'Attivo', description: '6-7 giorni a settimana' },
    { value: 'very_active', label: 'Molto Attivo', description: '2 volte al giorno o lavoro fisico' }
  ];

  public goalOptions = [
    { value: 'lose_weight', label: 'Perdere peso' },
    { value: 'maintain_weight', label: 'Mantenere peso' },
    { value: 'gain_weight', label: 'Aumentare peso' },
    { value: 'gain_muscle', label: 'Aumentare massa muscolare' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({personOutline,mailOutline,lockClosedOutline,calendarOutline,resizeOutline,scaleOutline,fitnessOutline,trendingUpOutline,eyeOutline,eyeOffOutline,manOutline,womanOutline,arrowBackOutline});
    
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      birth_date: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      height: ['', [Validators.required, Validators.min(100), Validators.max(250)]],
      weight: ['', [Validators.required, Validators.min(30), Validators.max(300)]],
      activity_level: ['moderate'],
      goal: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Se l'utente è già autenticato, reindirizza alla dashboard
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/tabs/dashboard']);
    }
  }

  /**
   * Validatore personalizzato per la password
   */
  passwordValidator(control: any) {
    const value = control.value;
    if (!value) return null;
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    
    if (hasUpperCase && hasLowerCase && hasNumber) {
      return null;
    }
    
    return { invalidPassword: true };
  }

  /**
   * Validatore per conferma password
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    confirmPassword?.setErrors(null);
    return null;
  }

  /**
   * Toggle visibilità password
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Gestisce la registrazione
   */
  async onRegister() {
    if (this.registerForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Creazione account...',
        spinner: 'crescent'
      });
      await loading.present();

      this.isLoading = true;
      
      const formData = { ...this.registerForm.value };
      delete formData.confirmPassword; // Rimuovi conferma password
      
      this.authService.register(formData).subscribe({
        next: async (response) => {
          await loading.dismiss();
          this.isLoading = false;
          
          if (response.success) {
            await this.showToast('Account creato con successo! Benvenuto in NutriJournal!', 'success');
            this.router.navigate(['/tabs/dashboard']);
          } else {
            await this.showToast(response.message || 'Errore durante la registrazione', 'danger');
          }
        },
        error: async (error) => {
          await loading.dismiss();
          this.isLoading = false;
          await this.showToast('Errore durante la registrazione. Riprova.', 'danger');
          console.error('Register error:', error);
        }
      });
    } else {
      await this.showToast('Compila tutti i campi correttamente', 'warning');
      this.markFormGroupTouched();
    }
  }

  /**
   * Naviga al login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Calcola l'età dalla data di nascita
   */
  calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Formatta la data per la visualizzazione
   */
  formatDisplayDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  }

  /**
   * Marca tutti i campi come touched per mostrare errori
   */
  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
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
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `Campo obbligatorio`;
      }
      if (field.errors['email']) {
        return 'Inserisci un indirizzo email valido';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Minimo ${requiredLength} caratteri`;
      }
      if (field.errors['min']) {
        return `Valore minimo: ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `Valore massimo: ${field.errors['max'].max}`;
      }
      if (field.errors['invalidPassword']) {
        return 'Password deve contenere almeno una maiuscola, una minuscola e un numero';
      }
      if (field.errors['passwordMismatch']) {
        return 'Le password non coincidono';
      }
    }
    return '';
  }

  /**
   * Controlla se il campo ha errori
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}
