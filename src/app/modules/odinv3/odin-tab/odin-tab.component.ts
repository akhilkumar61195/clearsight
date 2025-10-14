import { Component, Input, OnDestroy, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { distinctUntilChanged, Subscription } from 'rxjs';
import { routeLinks } from '../../../common/enum/common-enum';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-odin-tab',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './odin-tab.component.html',
  styleUrl: './odin-tab.component.scss'
})
export class OdinTabComponent implements OnDestroy {

  odinMenu: MenuItem[] | undefined;
  activeItem: MenuItem | undefined;
  currentBreakpoint: string = '';
  Breakpoints = Breakpoints;
  @Input() selectedFunction: number;

  // Subscription to manage API call subscriptions and prevent memory leaks
  private tabSubscription: Subscription = new Subscription();
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private breakpointObserver: BreakpointObserver
  ) {
    this.tabSubscription = this.breakpoint$.subscribe(() => this.breakpointChanged());
  }

  // Unsubscribe from all subscriptions to prevent memory leaks
  ngOnDestroy(): void {
    this.tabSubscription?.unsubscribe();
  }
  readonly breakpoint$ = this.breakpointObserver
    .observe([
      Breakpoints.Large,
      Breakpoints.Medium,
      Breakpoints.Small,
      '(min-width: 500px)',
    ])
    .pipe(distinctUntilChanged());

  ngOnChanges(changes: SimpleChanges) {
    const url = this.activatedRoute.snapshot["_routerState"].url;

    if (changes.selectedFunction.currentValue == 1) {
      this.odinMenu = [
        { label: `Dashboard`, disabled: false, routerLink: '/' + routeLinks.odinDashboard3, target: '_self' },
        { label: `Raw Data`, disabled: false, routerLink: '/' + routeLinks.odinRawdata3, target: '_self' }
      ];
    }

    else {
      this.odinMenu = [
        { label: `Dashboard`, disabled: false, routerLink: '/' + routeLinks.odinCompletionDashboard3, target: '_self' },
        { label: `Assembly`, disabled: false, routerLink: '/' + routeLinks.odin3Assembly, target: '_self' },
        { label: `Raw Data`, disabled: false, routerLink: '/' + routeLinks.odinCompletionRawdata3, target: '_self' }
      ];
    }
    this.activeItem = this.odinMenu[0];
  }
  private breakpointChanged() {
    if (this.breakpointObserver.isMatched(Breakpoints.Large)) {
      this.currentBreakpoint = Breakpoints.Large;
    } else if (this.breakpointObserver.isMatched(Breakpoints.Medium)) {
      this.currentBreakpoint = Breakpoints.Medium;
    } else if (this.breakpointObserver.isMatched(Breakpoints.Small)) {
      this.currentBreakpoint = Breakpoints.Small;
    }
  }
}
