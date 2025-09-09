import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { 
  ApiResponse, 
  Meal, 
  Product, 
  Activity, 
  NutritionGoals, 
  Analytics,
  PantryItem,
  ItalianDish,
  User
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
    
    return this.http.get<ApiResponse<Meal[]>>(url, { headers });
  }

  /**
   * Ottieni pasto specifico
   */
  getMeal(id: number): Observable<ApiResponse<Meal>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<Meal>>(`${this.baseUrl}/meals/${id}`, { headers });
  }

  /**
   * Crea nuovo pasto
   */
  createMeal(meal: Partial<Meal>): Observable<ApiResponse<Meal>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<ApiResponse<Meal>>(`${this.baseUrl}/meals`, meal, { headers });
  }

  /**
   * Aggiorna pasto
   */
  updateMeal(id: number, meal: Partial<Meal>): Observable<ApiResponse<Meal>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ApiResponse<Meal>>(`${this.baseUrl}/meals/${id}`, meal, { headers });
  }

  /**
   * Elimina pasto
   */
  deleteMeal(id: number): Observable<ApiResponse<any>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/meals/${id}`, { headers });
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
    );
  }

  /**
   * Ottieni prodotto per barcode
   */
  getProductByBarcode(barcode: string): Observable<ApiResponse<Product>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/products/barcode/${barcode}`, { headers });
  }

  /**
   * Ottieni prodotto per ID
   */
  getProduct(id: number): Observable<ApiResponse<Product>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/products/${id}`, { headers });
  }

  /**
   * Crea prodotto personalizzato
   */
  createCustomProduct(product: Partial<Product>): Observable<ApiResponse<Product>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<ApiResponse<Product>>(`${this.baseUrl}/products/custom`, product, { headers });
  }

  // =================== ACTIVITIES ===================

  /**
   * Ottieni tutte le attività
   */
  getActivities(page = 1, limit = 20): Observable<ApiResponse<Activity[]>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<Activity[]>>(`${this.baseUrl}/activities?page=${page}&limit=${limit}`, { headers });
  }

  /**
   * Crea nuova attività
   */
  createActivity(activity: Partial<Activity>): Observable<ApiResponse<Activity>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<ApiResponse<Activity>>(`${this.baseUrl}/activities`, activity, { headers });
  }

  /**
   * Aggiorna attività
   */
  updateActivity(id: number, activity: Partial<Activity>): Observable<ApiResponse<Activity>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ApiResponse<Activity>>(`${this.baseUrl}/activities/${id}`, activity, { headers });
  }

  /**
   * Elimina attività
   */
  deleteActivity(id: number): Observable<ApiResponse<any>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/activities/${id}`, { headers });
  }

  // =================== NUTRITION GOALS ===================

  /**
   * Ottieni obiettivi nutrizionali
   */
  getNutritionGoals(): Observable<ApiResponse<NutritionGoals>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<NutritionGoals>>(`${this.baseUrl}/nutrition/goals`, { headers });
  }

  /**
   * Aggiorna obiettivi nutrizionali
   */
  updateNutritionGoals(goals: Partial<NutritionGoals>): Observable<ApiResponse<NutritionGoals>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ApiResponse<NutritionGoals>>(`${this.baseUrl}/nutrition/goals`, goals, { headers });
  }

  /**
   * Ottieni nutrizione giornaliera per data specifica
   */
  getDailyNutrition(date: string): Observable<ApiResponse<any>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/nutrition/daily/${date}`, { headers });
  }

  // =================== ANALYTICS ===================

  /**
   * Ottieni analytics dashboard
   */
  getDashboardAnalytics(period: 'week' | 'month' | 'year' = 'week'): Observable<ApiResponse<Analytics>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<Analytics>>(`${this.baseUrl}/analytics/dashboard?period=${period}`, { headers });
  }

  /**
   * Ottieni trend nutrizionali
   */
  getNutritionTrends(period: string, dateFrom?: string, dateTo?: string): Observable<ApiResponse<any>> {
    const headers = this.authService.getAuthHeaders();
    let url = `${this.baseUrl}/analytics/nutrition-trends?period=${period}`;
    
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;
    
    return this.http.get<ApiResponse<any>>(url, { headers });
  }

  // =================== PANTRY ===================

  /**
   * Ottieni dispensa
   */
  getPantryItems(): Observable<ApiResponse<PantryItem[]>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<PantryItem[]>>(`${this.baseUrl}/pantry`, { headers });
  }

  /**
   * Aggiungi item alla dispensa
   */
  addToPantry(item: Partial<PantryItem>): Observable<ApiResponse<PantryItem>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<ApiResponse<PantryItem>>(`${this.baseUrl}/pantry`, item, { headers });
  }

  /**
   * Aggiorna item dispensa
   */
  updatePantryItem(id: number, item: Partial<PantryItem>): Observable<ApiResponse<PantryItem>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ApiResponse<PantryItem>>(`${this.baseUrl}/pantry/${id}`, item, { headers });
  }

  /**
   * Rimuovi item dalla dispensa
   */
  removeFromPantry(id: number): Observable<ApiResponse<any>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/pantry/${id}`, { headers });
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
    
    return this.http.get<ApiResponse<ItalianDish[]>>(url, { headers });
  }

  /**
   * Ottieni piatto italiano specifico
   */
  getItalianDish(id: number): Observable<ApiResponse<ItalianDish>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<ItalianDish>>(`${this.baseUrl}/italian-food/${id}`, { headers });
  }

  // =================== USER MANAGEMENT ===================

  /**
   * Aggiorna il profilo utente
   */
  updateUserProfile(data: Partial<User>): Observable<ApiResponse<User>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/profile`, data, { headers });
  }

  /**
   * Ottieni il profilo utente
   */
  getUserProfile(): Observable<ApiResponse<{ user: User; activeGoal?: any } | User>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ApiResponse<{ user: User; activeGoal?: any } | User>>(`${this.baseUrl}/users/profile`, { headers });
  }

  /**
   * Cambia password utente
   */
  changePassword(data: { currentPassword: string; newPassword: string }): Observable<ApiResponse<any>> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/auth/change-password`, data, { headers });
  }
}
