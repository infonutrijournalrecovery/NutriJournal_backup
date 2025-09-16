import 'chart.js/auto';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, {
	...appConfig,
	providers: [
		provideIonicAngular(),
		provideRouter(routes),
		...(appConfig.providers || [])
	]
});
