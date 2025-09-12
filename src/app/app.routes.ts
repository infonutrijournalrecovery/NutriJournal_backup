import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

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
    canActivate: [AuthGuard],
  },
  {
    path: 'scanner',
    loadComponent: () => import('./scanner/scanner.page').then((m) => m.ScannerPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'search',
    loadComponent: () => import('./search/search.page').then((m) => m.SearchPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [AuthGuard],
  },
  {
    path: 'profile/change-password',
    loadComponent: () => import('./profile/change-password/change-password.page').then((m) => m.ChangePasswordPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'profile/edit-personal',
    loadComponent: () => import('./profile/edit-personal/edit-personal.page').then((m) => m.EditPersonalPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'profile/view-goals',
    loadComponent: () => import('./profile/view-goals/view-goals.page').then((m) => m.ViewGoalsPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'meal/add',
    loadComponent: () => import('./meal-tracking/add-meal/add-meal.page').then((m) => m.AddMealPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'meal/edit/:id',
    loadComponent: () => import('./meal-tracking/add-meal/add-meal.page').then((m) => m.AddMealPage),
    canActivate: [AuthGuard],
  },

  {
    path: 'meal/view',
    loadComponent: () => import('./meal-tracking/view-meal/view-meal.page').then((m) => m.ViewMealPage),
    canActivate: [AuthGuard],
  },

  {
    path: 'activity/add',
    loadComponent: () => import('./activity-tracking/add-activity/add-Activity.page').then((m) => m.AddActivityPage),
    canActivate: [AuthGuard],
  },

  {
    path: 'pantry',
    loadComponent: () => import('./pantry/pantry.page').then((m) => m.PantryPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'product',
    loadComponent: () => import('./product/product.page').then((m) => m.ProductPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'product/:ean',
    loadComponent: () => import('./product/product.page').then((m) => m.ProductPage),
    canActivate: [AuthGuard],
  },

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

  // Default redirect: mostra la login se non autenticato
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  // Wildcard route: fallback a login
  {
    path: '**',
    redirectTo: 'login',
  },
];