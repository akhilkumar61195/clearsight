import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonTyrBuilderService {
  // Filter text signal added as, the searchbar moved to module interaction menu
  selectedFilterText: WritableSignal<string> = signal<string>('');
  
  // Grid expansion state - right grid is hidden by default
  isRightGridExpanded: WritableSignal<boolean> = signal<boolean>(false);

  // Managing the toggle between comparator view
  isComparatorViewSelected: WritableSignal<boolean> = signal<boolean>(false);

  constructor() { }
}
