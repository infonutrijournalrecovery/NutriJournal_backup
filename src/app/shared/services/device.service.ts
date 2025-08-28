import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isHybrid: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private deviceInfoSubject = new BehaviorSubject<DeviceInfo>(this.getDeviceInfo());
  public deviceInfo$ = this.deviceInfoSubject.asObservable();

  constructor(private platform: Platform) {
    this.initializeDeviceDetection();
  }

  private initializeDeviceDetection() {
    // Ascolta i cambiamenti di dimensione della finestra
    fromEvent(window, 'resize')
      .pipe(debounceTime(250))
      .subscribe(() => {
        this.updateDeviceInfo();
      });

    // Ascolta i cambiamenti di orientamento
    fromEvent(window, 'orientationchange')
      .pipe(debounceTime(300))
      .subscribe(() => {
        setTimeout(() => this.updateDeviceInfo(), 100);
      });

    // Aggiorna info iniziali
    this.updateDeviceInfo();
  }

  public getDeviceInfo(): DeviceInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Determina il tipo di dispositivo basato sulla larghezza dello schermo
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    
    // Controlla se è un'app ibrida (Capacitor/Cordova)
    const isHybrid = this.platform.is('hybrid') || 
                     this.platform.is('capacitor') || 
                     this.platform.is('cordova');

    // Determina l'orientamento
    const orientation: 'portrait' | 'landscape' = height > width ? 'portrait' : 'landscape';

    return {
      isMobile,
      isTablet,
      isDesktop,
      isHybrid,
      screenWidth: width,
      screenHeight: height,
      orientation
    };
  }

  private updateDeviceInfo() {
    const newDeviceInfo = this.getDeviceInfo();
    this.deviceInfoSubject.next(newDeviceInfo);
  }

  // Metodi di utilità
  getCurrentDeviceInfo(): DeviceInfo {
    return this.deviceInfoSubject.value;
  }

  // Observable per sottoscrivere ai cambiamenti del dispositivo
  getDeviceChanges() {
    return this.deviceInfo$;
  }

  isMobile(): boolean {
    return this.getCurrentDeviceInfo().isMobile;
  }

  isTablet(): boolean {
    return this.getCurrentDeviceInfo().isTablet;
  }

  isDesktop(): boolean {
    return this.getCurrentDeviceInfo().isDesktop;
  }

  isHybridApp(): boolean {
    return this.getCurrentDeviceInfo().isHybrid;
  }

  getScreenSize(): { width: number; height: number } {
    const info = this.getCurrentDeviceInfo();
    return {
      width: info.screenWidth,
      height: info.screenHeight
    };
  }

  getOptimalLayout(): 'mobile' | 'tablet' | 'desktop' {
    const info = this.getCurrentDeviceInfo();
    
    if (info.isMobile) return 'mobile';
    if (info.isTablet) return 'tablet';
    return 'desktop';
  }

  // Determina se mostrare la sidebar o i tabs
  shouldUseSidebar(): boolean {
    return this.isDesktop() && !this.isHybridApp();
  }

  // Determina il numero di colonne per grid responsive
  getGridColumns(): number {
    const info = this.getCurrentDeviceInfo();
    
    if (info.isMobile) return 1;
    if (info.isTablet) return 2;
    return 3;
  }

  // Determina la dimensione ottimale per i modali
  getModalBreakpoint(): number {
    const info = this.getCurrentDeviceInfo();
    
    if (info.isMobile) return 1; // Full screen
    if (info.isTablet) return 0.8;
    return 0.6; // Desktop modal più piccolo
  }
}
