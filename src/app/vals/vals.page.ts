import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartData } from 'chart.js';
import { ApiService } from '../shared/services/api.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-vals',
  templateUrl: './vals.page.html',
  styleUrls: ['./vals.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, BaseChartDirective]
})
export class ValsPage implements OnInit {
  public primary = '#75B972';
  public dark = '#415540';

  public metrics: string[] = [
    'Peso',
    'Calorie assunte',
    'Calorie bruciate',
    'Proteine',
    'Carboidrati',
    'Grassi',
    'Acqua'
  ];
  public selectedMetric: string = this.metrics[0];

  public periods: string[] = ['Settimanale', 'Mensile', 'Trimestrale'];
  public selectedPeriod: string = this.periods[0];

  public lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
      },
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: this.dark }
      },
      y: {
        grid: { color: '#eee' },
        ticks: { color: this.dark }
      }
    }
  };

  public quickStats = {
    average: null as number|null,
    trend: null as number|null,
    period: ''
  };

  private apiService = inject(ApiService);


  constructor() {}

  ngOnInit() {
    this.fetchStats();
  }

  async fetchStats() {
    const periodMap: Record<string, 'week' | 'month' | 'year'> = {
      'Settimanale': 'week',
      'Mensile': 'month',
      'Trimestrale': 'year'
    };
    const period = periodMap[this.selectedPeriod] || 'week';

    // Calcola date_from e date_to in base al periodo selezionato
    const today = new Date();
    let dateFrom: string;
    if (period === 'week') {
      dateFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (period === 'month') {
      dateFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (period === 'year') {
      dateFrom = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else {
      dateFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    const dateTo = today.toISOString().split('T')[0];

    try {
      // Dashboard analytics (overview)
      const resDashboard: any = await this.apiService.getDashboardAnalytics(period).toPromise();

      // Nutrition trends (dettaglio per metrica)
  const resTrends: any = await this.apiService.getNutritionTrends(period, dateFrom, dateTo).toPromise();
  console.log('[DEBUG][API] Risposta trends:', resTrends);

  // Supporta sia resTrends.data che resTrends.data.trends
      const trendsArr = Array.isArray(resTrends?.data)
        ? resTrends.data
        : Array.isArray(resTrends?.data?.trends)
          ? resTrends.data.trends
          : [];

      let chartLabels: string[] = [];
      let chartData: number[] = [];
      let average = 0;
      let trend = 0;

      // Scegli la fonte dati in base alla metrica
      if (this.selectedMetric === 'Peso') {
        chartData = trendsArr.map((d: any) => d.weight_kg).filter((v: any) => v != null);
        chartLabels = trendsArr.map((d: any) => d.date);
      } else if (this.selectedMetric === 'Calorie assunte') {
        chartData = trendsArr.map((d: any) => d.calories_consumed).filter((v: any) => v != null);
        chartLabels = trendsArr.map((d: any) => d.date);
      } else if (this.selectedMetric === 'Calorie bruciate') {
        chartData = trendsArr.map((d: any) => d.calories_burned).filter((v: any) => v != null);
        chartLabels = trendsArr.map((d: any) => d.date);
      } else if (this.selectedMetric === 'Proteine') {
        chartData = trendsArr.map((d: any) => d.proteins_consumed).filter((v: any) => v != null);
        chartLabels = trendsArr.map((d: any) => d.date);
      } else if (this.selectedMetric === 'Carboidrati') {
        chartData = trendsArr.map((d: any) => d.carbs_consumed).filter((v: any) => v != null);
        chartLabels = trendsArr.map((d: any) => d.date);
      } else if (this.selectedMetric === 'Grassi') {
        chartData = trendsArr.map((d: any) => d.fats_consumed).filter((v: any) => v != null);
        chartLabels = trendsArr.map((d: any) => d.date);
      } else if (this.selectedMetric === 'Acqua') {
        chartData = trendsArr.map((d: any) => d.water_consumed).filter((v: any) => v != null);
        chartLabels = trendsArr.map((d: any) => d.date);
      }

  average = chartData.length ? chartData.reduce((a, b) => a + b, 0) / chartData.length : 0;
  trend = chartData.length > 1 && chartData[0] !== 0 ? ((chartData[chartData.length - 1] - chartData[0]) / chartData[0]) * 100 : 0;

      this.lineChartData = {
        labels: chartLabels,
        datasets: [
          {
            label: this.selectedMetric,
            data: chartData,
            tension: 0.4,
            borderColor: this.primary,
            backgroundColor: 'rgba(117,185,114,0.08)',
            pointBackgroundColor: this.dark,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
          }
        ]
      };
      this.quickStats.average = average;
      this.quickStats.trend = trend;
      this.quickStats.period = this.selectedPeriod;
    } catch (err) {
      this.lineChartData = { labels: [], datasets: [] };
      this.quickStats.average = null;
      this.quickStats.trend = null;
      this.quickStats.period = this.selectedPeriod;
    }
  }

  selectMetric(m: string) {
    this.selectedMetric = m;
    this.fetchStats();
  }

  selectPeriod(p: any) {
    this.selectedPeriod = String(p || '');
    this.fetchStats();
  }

  formatValue(val: number|null) {
    if (val == null || isNaN(val)) return '-';
    return Number.isInteger(val) ? val : parseFloat(val.toFixed(1));
  }
}