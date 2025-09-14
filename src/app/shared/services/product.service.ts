import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Product {
  id: string;
  name: string;
  name_it?: string;
  brand: string;
  brand_it?: string;
  image: string;
  category?: string;
  description?: string;
  source?: string;
  serving?: {
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
  ingredients_it?: string;
  allergens: string[];
  additives?: any[];
}

/**
 * Funzione di normalizzazione universale per oggetti prodotto provenienti da USDA, OpenFoodFacts, DB locale, ecc.
 * Restituisce un oggetto conforme all'interfaccia Product del frontend, gestendo fallback e campi mancanti.
 */
export function normalizeProduct(raw: any): Product {
  return {
    id: String(raw.id ?? raw._id ?? raw.code ?? ''),
    name: raw.name ?? raw.display_name ?? raw.product_name ?? raw.title ?? '',
    name_it: raw.name_it ?? undefined,
    brand: raw.brand ?? raw.brands ?? '',
    brand_it: raw.brand_it ?? undefined,
    image: raw.image ?? raw.image_url ?? raw.image_front_url ?? '',
    category: raw.category ?? undefined,
    description: raw.description ?? undefined,
    source: raw.source ?? undefined,
    serving: raw.serving || (raw.portion_size ? {
      size: raw.portion_size.description ?? '',
      quantity: raw.portion_size.amount ?? 100,
      unit: raw.portion_size.unit ?? 'g',
      description: raw.portion_size.description ?? ''
    } : undefined),
    nutrition_per_100g: {
      calories: raw.nutrition_per_100g?.calories ?? raw.nutrition?.calories ?? 0,
      proteins: raw.nutrition_per_100g?.proteins ?? raw.nutrition?.proteins ?? 0,
      carbohydrates: raw.nutrition_per_100g?.carbohydrates ?? raw.nutrition?.carbohydrates ?? 0,
      fats: raw.nutrition_per_100g?.fats ?? raw.nutrition?.fats ?? 0,
      saturated_fat: raw.nutrition_per_100g?.saturated_fat ?? raw.nutrition?.saturated_fat ?? 0,
      fiber: raw.nutrition_per_100g?.fiber ?? raw.nutrition?.fiber ?? 0,
      sodium: raw.nutrition_per_100g?.sodium ?? raw.nutrition?.sodium ?? 0,
      sugars: raw.nutrition_per_100g?.sugars ?? raw.nutrition?.sugars ?? 0,
    },
    ingredients: raw.ingredients ?? raw.ingredients_text ?? '',
    ingredients_it: raw.ingredients_it ?? undefined,
    allergens: Array.isArray(raw.allergens) ? raw.allergens : (raw.allergens ? String(raw.allergens).split(',').map((a: string) => a.trim()) : []),
    additives: raw.additives ?? [],
  };
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

  // Cerca prodotti per nome tramite backend (USDA/OpenFoodFacts)
  searchProductsByName(query: string, page: number = 1, limit: number = 20): Observable<{success: boolean, data: {products: Product[], pagination: any}}>{
    return this.http.get<{success: boolean, data: {products: Product[], pagination: any}}>(
      `${this.apiUrl}/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  }

  // Verifica se il prodotto è già in dispensa tramite nome e brand
  checkProductInPantry(name: string, brand: string): Observable<{success: boolean, inPantry: boolean}> {
    const params = new URLSearchParams({ name, brand });
    return this.http.get<{success: boolean, inPantry: boolean}>(`${environment.apiUrl}/pantry/has?${params.toString()}`);
  }


  // Verifica se il prodotto è già in dispensa tramite barcode/EAN (solo endpoint corretto)
  checkProductInPantryByBarcode(barcode: string): Observable<{success: boolean, inPantry: boolean}> {
    return this.http.get<{success: boolean, inPantry: boolean}>(`${environment.apiUrl}/pantry/has-product?barcode=${encodeURIComponent(barcode)}`);
  }

  // Elimina prodotto dalla dispensa tramite id
  deleteProductFromPantryById(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/pantry/${id}`);
  }

  // Aggiungi prodotto in dispensa tramite barcode/EAN, nome, quantità e unità
  addProductToPantryByBarcode(barcode: string, name: string, quantity: number = 1, unit: string = 'pz', brand: string = '', category: string = ''): Observable<any> {
    const body = { barcode, name, quantity, unit, brand, category };
    console.log('DEBUG POST /api/pantry', body);
    return this.http.post(`${environment.apiUrl}/pantry`, body);
  }
}
