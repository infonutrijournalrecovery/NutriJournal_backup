import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  serving: {
    size: string;
    quantity: number;
    unit: string;
    description: string;
  };
  nutrition_per_100g: {
    calories: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
    saturated_fat: number;
    fiber: number;
    sodium: number;
    sugars: number;
  };
  ingredients: string;
  allergens: string[];
  additives?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/products'; // Assumendo che l'URL base sia in environment

  getProductByBarcode(barcode: string): Observable<{success: boolean, data: Product}> {
    // Nota: il token di autenticazione viene aggiunto dall'interceptor, se configurato
    return this.http.get<{success: boolean, data: Product}>(`${this.apiUrl}/barcode/${barcode}`);
  }

  // Verifica se il prodotto è già in dispensa tramite nome e brand
  checkProductInPantry(name: string, brand: string): Observable<{success: boolean, inPantry: boolean}> {
    const params = new URLSearchParams({ name, brand });
    return this.http.get<{success: boolean, inPantry: boolean}>(`${environment.apiUrl}/pantry/has?${params.toString()}`);
  }

  // Verifica se il prodotto è già in dispensa tramite barcode/EAN
  checkProductInPantryByBarcode(barcode: string): Observable<{success: boolean, inPantry: boolean}> {
    return this.http.get<{success: boolean, inPantry: boolean}>(`${environment.apiUrl}/pantry/has-product?barcode=${encodeURIComponent(barcode)}`);
  }

  // Aggiungi prodotto in dispensa tramite barcode/EAN, nome, quantità e unità
  addProductToPantryByBarcode(barcode: string, name: string, quantity: number = 1, unit: string = 'pz', brand: string = '', category: string = ''): Observable<any> {
    const body = { barcode, name, quantity, unit, brand, category };
    console.log('DEBUG POST /api/pantry', body);
    return this.http.post(`${environment.apiUrl}/pantry`, body);
  }
}
