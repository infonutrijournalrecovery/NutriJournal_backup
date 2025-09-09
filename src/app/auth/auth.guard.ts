import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    const token = localStorage.getItem('nutrijournal_token');
    if (!token) {
      this.router.navigate(['/login']);
      return of(false);
    }
    // Verifica validità token lato backend
    return this.authService.verifyToken().pipe(
      tap(isValid => {
        if (!isValid) {
          this.router.navigate(['/login']);
        }
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
