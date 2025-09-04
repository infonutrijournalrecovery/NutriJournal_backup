import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'scanner',
    loadComponent: () => import('./scanner/scanner.page').then((m) => m.ScannerPage),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'profile/change-password',
    loadComponent: () => import('./profile/change-password/change-password.page').then((m) => m.ChangePasswordPage),
  },
  {
    path: 'profile/edit-personal',
    loadComponent: () => import('./profile/edit-personal/edit-personal.page').then((m) => m.EditPersonalPage),
  },
  {
    path: 'profile/view-goals',
    loadComponent: () => import('./profile/view-goals/view-goals.page').then((m) => m.ViewGoalsPage),
  },
  {
    path: 'meal/add',
    loadComponent: () => import('./meal-tracking/add-meal/add-meal.page').then((m) => m.AddMealPage),
  },
  {
    path: 'meal/edit/:id',
    loadComponent: () => import('./meal-tracking/add-meal/add-meal.page').then((m) => m.AddMealPage),
  },
  
  {
    path: 'activity/add',
    loadComponent: () => import('./activity-tracking/add-activity/add-Activity.page').then((m) => m.AddActivityPage),
  },
  {
    path: 'pantry',
    loadComponent: () => import('./pantry/pantry.page').then((m) => m.PantryPage),
  },
  {
    path: 'product',
    loadComponent: () => import('./product/product.page').then((m) => m.ProductPage),
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


        path: 'meal/add',


        loadComponent: () => import('./meal-tracking/add-meal/add-meal.page').then((m) => m.AddMealPage),


      },


      {


        path: 'meal/edit/:id',


        loadComponent: () => import('./meal-tracking/add-meal/add-meal.page').then((m) => m.AddMealPage),


      },


      {


        path: 'activity/add',


        loadComponent: () => import('./activity-tracking/add-activity/add-Activity.page').then((m) => m.AddActivityPage),


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

  // Standalone pages (quando chiamate dall'esterno delle tabs)
  {
    path: 'scanner',
    loadComponent: () => import('./scanner/scanner.page').then((m) => m.ScannerPage),
  },

  // Default redirects - tutto porta alla dashboard principale
  {
    path: '',
    redirectTo: 'tabs/dashboard',
    pathMatch: 'full',
  },
  
  // Wildcard route - gestisce tutti i path non trovati
  {
    path: '**',
    redirectTo: 'tabs/dashboard',
  },
];
