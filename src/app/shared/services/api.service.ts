import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { 
  ApiResponse, 
  Meal, 
  Product, 
  Activity, 
  NutritionGoals, 
  Analytics,
  PantryItem,
  ItalianDish
} from '../interfaces/types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // =================== MEALS ===================

  /**
   * Ottieni tutti i pasti dell'utente
   */
  getMeals(page = 1, limit = 20, dateFrom?: string, dateTo?: string): Observable<ApiResponse<Meal[]>> {
    const headers = this.authService.getAuthHeaders();
    let url = `${this.baseUrl}/meals?page=${page}&limit=${limit}`;
    
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;
    
    return this.http.get<ApiResponse<Meal[]>>(url, { headers })
      .pipe(catchError(this.handleError('getMeals')));
  }

  /**
   * Ottieni pasto specifico
   */
  getMeal(id: number): Observable<ApiResponse<Meal>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<Meal>>(`${this.baseUrl}/meals/${id}`, { headers })
      .pipe(catchError(this.handleError('getMeal')));
  }

  /**
   * Crea nuovo pasto
   */
  createMeal(meal: Partial<Meal>): Observable<ApiResponse<Meal>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<ApiResponse<Meal>>(`${this.baseUrl}/meals`, meal, { headers })
      .pipe(catchError(this.handleError('createMeal')));
  }

  /**
   * Aggiorna pasto
   */
  updateMeal(id: number, meal: Partial<Meal>): Observable<ApiResponse<Meal>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ApiResponse<Meal>>(`${this.baseUrl}/meals/${id}`, meal, { headers })
      .pipe(catchError(this.handleError('updateMeal')));
  }

  /**
   * Elimina pasto
   */
  deleteMeal(id: number): Observable<ApiResponse<any>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/meals/${id}`, { headers })
      .pipe(catchError(this.handleError('deleteMeal')));
  }

  // =================== PRODUCTS ===================

  /**
   * Cerca prodotti
   */
  searchProducts(query: string, page = 1, limit = 20): Observable<ApiResponse<Product[]>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<Product[]>>(
      `${this.baseUrl}/products/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, 
      { headers }
    ).pipe(catchError(this.handleError('searchProducts')));
  }

  /**
   * Ottieni prodotto per barcode
   */
  getProductByBarcode(barcode: string): Observable<ApiResponse<Product>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/products/barcode/${barcode}`, { headers })
      .pipe(catchError(this.handleError('getProductByBarcode')));
  }

  /**
   * Ottieni prodotto per ID
   */
  getProduct(id: number): Observable<ApiResponse<Product>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/products/${id}`, { headers })
      .pipe(catchError(this.handleError('getProduct')));
  }

  /**
   * Crea prodotto personalizzato
   */
  createCustomProduct(product: Partial<Product>): Observable<ApiResponse<Product>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<ApiResponse<Product>>(`${this.baseUrl}/products/custom`, product, { headers })
      .pipe(catchError(this.handleError('createCustomProduct')));
  }

  // =================== ACTIVITIES ===================

  /**
   * Ottieni tutte le attività
   */
  getActivities(page = 1, limit = 20): Observable<ApiResponse<Activity[]>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<Activity[]>>(`${this.baseUrl}/activities?page=${page}&limit=${limit}`, { headers })
      .pipe(catchError(this.handleError('getActivities')));
  }

  /**
   * Crea nuova attività
   */
  createActivity(activity: Partial<Activity>): Observable<ApiResponse<Activity>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<ApiResponse<Activity>>(`${this.baseUrl}/activities`, activity, { headers })
      .pipe(catchError(this.handleError('createActivity')));
  }

  /**
   * Aggiorna attività
   */
  updateActivity(id: number, activity: Partial<Activity>): Observable<ApiResponse<Activity>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ApiResponse<Activity>>(`${this.baseUrl}/activities/${id}`, activity, { headers })
      .pipe(catchError(this.handleError('updateActivity')));
  }

  /**
   * Elimina attività
   */
  deleteActivity(id: number): Observable<ApiResponse<any>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/activities/${id}`, { headers })
      .pipe(catchError(this.handleError('deleteActivity')));
  }

  // =================== NUTRITION GOALS ===================

  /**
   * Ottieni obiettivi nutrizionali
   */
  getNutritionGoals(): Observable<ApiResponse<NutritionGoals>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<NutritionGoals>>(`${this.baseUrl}/nutrition/goals`, { headers })
      .pipe(catchError(this.handleError('getNutritionGoals')));
  }

  /**
   * Aggiorna obiettivi nutrizionali
   */
  updateNutritionGoals(goals: Partial<NutritionGoals>): Observable<ApiResponse<NutritionGoals>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ApiResponse<NutritionGoals>>(`${this.baseUrl}/nutrition/goals`, goals, { headers })
      .pipe(catchError(this.handleError('updateNutritionGoals')));
  }

  /**
   * Ottieni nutrizione giornaliera per data specifica
   */
  getDailyNutrition(date: string): Observable<ApiResponse<any>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/nutrition/daily/${date}`, { headers })
      .pipe(catchError(this.handleError('getDailyNutrition')));
  }

  // =================== ANALYTICS ===================

  /**
   * Ottieni analytics dashboard
   */
  getDashboardAnalytics(period: 'week' | 'month' | 'year' = 'week'): Observable<ApiResponse<Analytics>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<Analytics>>(`${this.baseUrl}/analytics/dashboard?period=${period}`, { headers })
      .pipe(catchError(this.handleError('getDashboardAnalytics')));
  }

  /**
   * Ottieni trend nutrizionali
   */
  getNutritionTrends(period: string, dateFrom?: string, dateTo?: string): Observable<ApiResponse<any>> {
    const headers = this.authService.getAuthHeaders();
    let url = `${this.baseUrl}/analytics/nutrition-trends?period=${period}`;
    
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;
    
    return this.http.get<ApiResponse<any>>(url, { headers })
      .pipe(catchError(this.handleError('getNutritionTrends')));
  }

  // =================== PANTRY ===================

  /**
   * Ottieni dispensa
   */
  getPantryItems(): Observable<ApiResponse<PantryItem[]>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<PantryItem[]>>(`${this.baseUrl}/pantry`, { headers })
      .pipe(catchError(this.handleError('getPantryItems')));
  }

  /**
   * Aggiungi item alla dispensa
   */
  addToPantry(item: Partial<PantryItem>): Observable<ApiResponse<PantryItem>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<ApiResponse<PantryItem>>(`${this.baseUrl}/pantry`, item, { headers })
      .pipe(catchError(this.handleError('addToPantry')));
  }

  /**
   * Aggiorna item dispensa
   */
  updatePantryItem(id: number, item: Partial<PantryItem>): Observable<ApiResponse<PantryItem>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ApiResponse<PantryItem>>(`${this.baseUrl}/pantry/${id}`, item, { headers })
      .pipe(catchError(this.handleError('updatePantryItem')));
  }

  /**
   * Rimuovi item dalla dispensa
   */
  removeFromPantry(id: number): Observable<ApiResponse<any>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/pantry/${id}`, { headers })
      .pipe(catchError(this.handleError('removeFromPantry')));
  }

  // =================== ITALIAN RECIPES ===================

  /**
   * Cerca ricette italiane
   */
  searchItalianRecipes(query?: string, region?: string, category?: string): Observable<ApiResponse<ItalianDish[]>> {
    const headers = this.authService.getAuthHeaders();
    let url = `${this.baseUrl}/italian-food/search`;
    const params = [];
    
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    if (region) params.push(`region=${encodeURIComponent(region)}`);
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get<ApiResponse<ItalianDish[]>>(url, { headers })
      .pipe(catchError(this.handleError('searchItalianRecipes')));
  }

  /**
   * Ottieni piatto italiano specifico
   */
  getItalianDish(id: number): Observable<ApiResponse<ItalianDish>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<ItalianDish>>(`${this.baseUrl}/italian-food/${id}`, { headers })
      .pipe(catchError(this.handleError('getItalianDish')));
  }

  // =================== UTILITY ===================

  /**
   * Gestione errori
   */
  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      return of({
        success: false,
        message: error.error?.message || 'Si è verificato un errore',
        errors: error.error?.errors || []
      } as T);
    };
  }
}
