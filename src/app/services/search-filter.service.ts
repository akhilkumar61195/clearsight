import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchFilterService {
  private filterSubject = new BehaviorSubject<{ text: string, option: string }>({ text: '', option: '' });

  filter$ = this.filterSubject.asObservable();

  updateFilter(text: string, option: string): void {
    this.filterSubject.next({ text, option });
  }
}
