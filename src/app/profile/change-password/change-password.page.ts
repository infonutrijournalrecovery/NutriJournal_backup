import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  ToastController,
  LoadingController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkOutline,
  shieldCheckmarkOutline,
  checkmarkCircle,
  ellipseOutline,
  closeCircle,
  bulbOutline,
  shieldOutline,
  timeOutline
} from 'ionicons/icons';

import { AuthService } from '../../shared/services/auth.service';
import { ApiService } from '../../shared/services/api.service';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordStrength {
  level: 'weak' | 'fair' | 'good' | 'strong';
  label: string;
  percentage: number;
}

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner
  ]
})
export class ChangePasswordPage implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);

  // Form data
  formData: PasswordFormData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Loading states
  isLoading = false;
  isSubmitting = false;

  // Visibility toggles
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Validation states
  currentPasswordError = '';
  newPasswordError = '';
  confirmPasswordError = '';

  // Password strength
  passwordStrength: PasswordStrength = {
    level: 'weak',
    label: 'Debole',
    percentage: 0
  };

  passwordRequirements: PasswordRequirements = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  };

  passwordsMatch = false;

  constructor() {
    addIcons({
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      checkmarkOutline,
      shieldCheckmarkOutline,
      checkmarkCircle,
      ellipseOutline,
      closeCircle,
      bulbOutline,
      shieldOutline,
      timeOutline
    });
  }

  ngOnInit() {
    // Initialization logic if needed
  }

  /**
   * Toggle password visibility
   */
  toggleCurrentPasswordVisibility() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Clear all error messages
   */
  clearErrors() {
    this.currentPasswordError = '';
    this.newPasswordError = '';
    this.confirmPasswordError = '';
  }

  /**
   * Validate new password strength
   */
  validateNewPassword() {
    const password = this.formData.newPassword;
    
    // Update requirements
    this.passwordRequirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Calculate strength
    const metRequirements = Object.values(this.passwordRequirements).filter(Boolean).length;
    
    if (metRequirements <= 1) {
      this.passwordStrength = { level: 'weak', label: 'Debole', percentage: 25 };
    } else if (metRequirements <= 2) {
      this.passwordStrength = { level: 'fair', label: 'Discreta', percentage: 50 };
    } else if (metRequirements <= 4) {
      this.passwordStrength = { level: 'good', label: 'Buona', percentage: 75 };
    } else {
      this.passwordStrength = { level: 'strong', label: 'Forte', percentage: 100 };
    }

    // Validate password match
    this.validatePasswordMatch();
  }

  /**
   * Validate password confirmation
   */
  validatePasswordMatch() {
    if (this.formData.newPassword && this.formData.confirmPassword) {
      this.passwordsMatch = this.formData.newPassword === this.formData.confirmPassword;
    } else {
      this.passwordsMatch = false;
    }
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return (
      this.formData.currentPassword.length > 0 &&
      this.formData.newPassword.length >= 8 &&
      this.formData.confirmPassword.length > 0 &&
      this.passwordsMatch &&
      this.passwordRequirements.minLength &&
      this.passwordRequirements.hasUppercase &&
      this.passwordRequirements.hasLowercase &&
      this.passwordRequirements.hasNumber
    );
  }

  /**
   * Submit password change
   */
  async changePassword() {
    if (!this.formData.currentPassword || !this.formData.newPassword || !this.formData.confirmPassword) {
      await this.showToast('Compila tutti i campi password', 'warning');
      return;
    }
    if (!this.isFormValid()) {
      await this.showToast('La nuova password non rispetta i requisiti o le password non coincidono', 'warning');
      return;
    }

    // DEBUG: logga i dati che verranno inviati
    console.log('DEBUG changePassword payload:', {
      currentPassword: this.formData.currentPassword,
      newPassword: this.formData.newPassword
    });

    this.isSubmitting = true;
    this.clearErrors();

    try {
      // Create loading
      const loading = await this.loadingController.create({
        message: 'Aggiornamento password...',
        duration: 10000
      });
      await loading.present();

      // Call API to change password
      const response = await this.apiService.changePassword({
        currentPassword: this.formData.currentPassword,
        newPassword: this.formData.newPassword
      }).toPromise();

      await loading.dismiss();

      if (response?.success) {
        // Show success message
        await this.showSuccessAlert();
        
        // Clear form
        this.formData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        
        // Navigate back to profile
        this.router.navigate(['/profile']);
      } else {
        throw new Error(response?.message || 'Errore durante il cambio password');
      }

    } catch (error: any) {
      console.error('Errore cambio password:', error);
      
      // Handle specific errors
      if (error.status === 401 || error.message?.includes('password attuale')) {
        this.currentPasswordError = 'Password attuale non corretta';
      } else if (error.status === 400) {
        this.newPasswordError = error.message || 'Nuova password non valida';
      } else {
        await this.showToast('Errore durante il cambio password. Riprova.', 'danger');
      }
    } finally {
      this.isSubmitting = false;
      try {
        const loading = await this.loadingController.getTop();
        if (loading) {
          await loading.dismiss();
        }
      } catch (e) {
        // Loading already dismissed
      }
    }
  }

  /**
   * Show success alert
   */
  private async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Password Aggiornata',
      subHeader: 'Successo!',
      message: 'La tua password è stata cambiata con successo. Per sicurezza, esegui nuovamente il login sui tuoi altri dispositivi.',
      buttons: [
        {
          text: 'OK',
          role: 'confirm',
          cssClass: 'primary'
        }
      ]
    });

    await alert.present();
  }

  /**
   * Show toast message
   */
  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }
}
