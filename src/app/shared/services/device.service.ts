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
    
    // Controlla se � un'app ibrida (Capacitor/Cordova)
    const isHybrid = this.platform.is('hybrid') || 
                     this.platform.is('capacitor') || 
                     this.platform.is('cordova');
    
    // Usa una combinazione di fattori per determinare il tipo di dispositivo
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Determina il tipo di dispositivo basato su pi� fattori
    const isMobile = width < 768 && (isMobileDevice || hasTouch);
    const isTablet = (width >= 768 && width < 1200 && hasTouch) || 
                     (this.platform.is('tablet')) || 
                     (isMobileDevice && Math.min(width, height) > 768);
    const isDesktop = !isMobile && !isTablet;
    
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
    console.log('Device Detection Details:', {
      width: window.innerWidth,
      height: window.innerHeight,
      userAgent: navigator.userAgent,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isPlatformTablet: this.platform.is('tablet'),
      deviceInfo: newDeviceInfo
    });
    this.deviceInfoSubject.next(newDeviceInfo);
  }

  // Metodi di utilit�
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
    return 0.6; // Desktop modal pi� piccolo
  }
}