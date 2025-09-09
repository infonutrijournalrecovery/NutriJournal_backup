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
    return this.http.get<{success: boolean, inPantry: boolean}>(`http://localhost:3000/api/pantry/has?${params.toString()}`);
  }
}
