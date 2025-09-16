import { BaseChartDirective } from 'ng2-charts';
import { Component } from '@angular/core';
import { OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NgChartsModule } from 'ng2-charts';
import { ChartOptions, ChartData } from 'chart.js';
import { ApiService } from '../shared/services/api.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-vals',
  templateUrl: './vals.page.html',
  styleUrls: ['./vals.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, NgChartsModule]
})
export class ValsPage implements OnInit {
  // Forza aggiornamento grafico
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  constructor(private cdRef: ChangeDetectorRef) {}
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
    const resDashboard: any = await this.apiService.getDashboardAnalytics(period).toPromise();
    const resTrends: any = await this.apiService.getNutritionTrends(period, dateFrom, dateTo).toPromise();
    console.log('[DEBUG][API] Risposta trends:', resTrends);
    if (Array.isArray(resTrends?.data?.trends)) {
      console.log('[DEBUG][API] Oggetti trends:', JSON.stringify(resTrends.data.trends, null, 2));
    }

    const trendsArr = Array.isArray(resTrends?.data)
      ? resTrends.data
      : Array.isArray(resTrends?.data?.trends)
        ? resTrends.data.trends
        : [];

    // 1. Genera tutte le date del periodo
    function getDateRange(from: string, to: string): string[] {
      const dates = [];
      let current = new Date(from);
      const end = new Date(to);
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    }
    const allDates = getDateRange(dateFrom, dateTo);

    // 2. Mappa backend data → { date: value }
    const valueKeyMap: Record<string, string> = {
      'Peso': 'weight_kg',
      'Calorie assunte': 'calories_consumed',
      'Calorie bruciate': 'calories_burned',
      'Proteine': 'proteins_consumed',
      'Carboidrati': 'carbs_consumed',
      'Grassi': 'fats_consumed',
      'Acqua': 'water_consumed'
    };
    const valueKey = valueKeyMap[this.selectedMetric];
    const dateValueMap: Record<string, number|null> = {};
    for (const d of trendsArr) {
      if (d.date && d[valueKey] != null) {
        dateValueMap[d.date] = d[valueKey];
      }
    }

    // 3. Mapping ottimizzato per Peso: gap/null nei giorni senza dati
    const chartLabels: string[] = allDates;
    let chartData: (number|null)[] = [];
    if (this.selectedMetric === 'Peso') {
      chartData = allDates.map(date => dateValueMap[date] != null ? dateValueMap[date]! : null);
    } else {
      chartData = allDates.map(date => dateValueMap[date] != null ? dateValueMap[date]! : 0);
    }

    // 4. Calcola stats solo sui giorni con valori reali
    const dataDays = allDates.filter(date => dateValueMap[date] != null);
    const dataValues = dataDays.map(date => dateValueMap[date]!);
    const average = dataValues.length
      ? dataValues.reduce((a, b) => a + b, 0) / dataValues.length
      : 0;
    const trend = dataValues.length > 1 && dataValues[0] !== 0
      ? ((dataValues[dataValues.length - 1] - dataValues[0]) / dataValues[0]) * 100
      : 0;

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

    console.log('[DEBUG][Chart] lineChartData:', this.lineChartData);
    console.log('[DEBUG][QuickStats] quickStats:', this.quickStats);

    this.cdRef.detectChanges();
    if (this.chart) {
      this.chart.update();
    }
  } catch (err) {
    this.lineChartData = { labels: [], datasets: [] };
    this.quickStats.average = null;
    this.quickStats.trend = null;
    this.quickStats.period = this.selectedPeriod;
    console.error('[ERROR][Chart] fetchStats error:', err);
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