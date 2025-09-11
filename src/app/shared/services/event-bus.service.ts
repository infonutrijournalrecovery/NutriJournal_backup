import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventBusService {
  private dataUpdatedSource = new Subject<string>();
  dataUpdated$ = this.dataUpdatedSource.asObservable();

  emitDataUpdated(type: 'activity' | 'meal' | 'water' | 'all' = 'all') {
    this.dataUpdatedSource.next(type);
  }
}
