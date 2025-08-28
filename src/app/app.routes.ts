import { Routes } from '@angular/router';

export const routes: Routes = [
  // Auth routes
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then((m) => m.RegisterPage),
  },
  
  // Main app with tabs
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'scanner',
        loadComponent: () => import('./scanner/scanner.page').then((m) => m.ScannerPage),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // Standalone pages
  {
    path: 'scanner',
    loadComponent: () => import('./scanner/scanner.page').then((m) => m.ScannerPage),
  },

  // Default redirects
  {
    path: 'home',
    redirectTo: 'tabs/dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
