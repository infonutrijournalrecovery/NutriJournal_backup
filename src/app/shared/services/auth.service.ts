import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../interfaces/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Carica token e utente dal localStorage all'avvio
    const token = localStorage.getItem('nutrijournal_token');
    const user = localStorage.getItem('nutrijournal_user');
    
    if (token) {
      this.tokenSubject.next(token);
    }
    
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  // Osservabili per componenti
  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  get token$(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.tokenSubject.asObservable().pipe(
      map(token => !!token)
    );
  }

  // Getters sincroni
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Login utente
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data.token, response.data.user);
          }
        }),
        catchError(this.handleError<AuthResponse>('login'))
      );
  }

  /**
   * Registrazione utente
   */
  register(userData: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data.token, response.data.user);
          }
        }),
        catchError(this.handleError<AuthResponse>('register'))
      );
  }

  /**
   * Recupero password
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email })
      .pipe(
        catchError(this.handleError('forgotPassword'))
      );
  }

  /**
   * Reset password
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { 
      token, 
      newPassword 
    }).pipe(
      catchError(this.handleError('resetPassword'))
    );
  }

  /**
   * Logout utente
   */
  logout(): void {
    // Rimuovi dati dal localStorage
    localStorage.removeItem('nutrijournal_token');
    localStorage.removeItem('nutrijournal_user');
    
    // Reset dei subject
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    
    // Redirect al login
    this.router.navigate(['/login']);
  }

  /**
   * Aggiorna profilo utente
   */
  updateProfile(userData: Partial<User>): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`http://localhost:3000/api/users/profile`, userData, { headers })
      .pipe(
        tap((response: any) => {
          if (response.success && response.data) {
            // Aggiorna l'utente corrente
            const updatedUser = { ...this.currentUser, ...response.data };
            this.currentUserSubject.next(updatedUser);
            localStorage.setItem('nutrijournal_user', JSON.stringify(updatedUser));
          }
        }),
        catchError(this.handleError('updateProfile'))
      );
  }

  /**
   * Verifica se il token è valido
   */
  verifyToken(): Observable<boolean> {
    if (!this.token) {
      return of(false);
    }

    const headers = this.getAuthHeaders();
    return this.http.get(`http://localhost:3000/api/users/profile`, { headers })
      .pipe(
        map(() => true),
        catchError(() => {
          this.logout();
          return of(false);
        })
      );
  }

  /**
   * Imposta la sessione utente
   */
  private setSession(token: string, user: User): void {
    localStorage.setItem('nutrijournal_token', token);
    localStorage.setItem('nutrijournal_user', JSON.stringify(user));
    
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
  }

  /**
   * Ottieni headers con autorizzazione
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.token;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Gestione errori
   */
  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Se errore 401, logout automatico
      if (error.status === 401) {
        this.logout();
      }
      
      // Ritorna un risultato vuoto per non bloccare l'app
      return of({
        success: false,
        message: error.error?.message || 'Si è verificato un errore',
        errors: error.error?.errors || []
      } as T);
    };
  }
}
