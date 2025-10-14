import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { distinctUntilChanged } from 'rxjs';
import { routeLinks } from '../../../common/enum/common-enum';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-tab',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.scss'
})
export class TabComponent {

  odinMenu: MenuItem[] | undefined;
  activeItem: MenuItem | undefined;
  currentBreakpoint: string = '';
  Breakpoints = Breakpoints;
  @Input() selectedFunction: number;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private breakpointObserver: BreakpointObserver
  ) {
    this.breakpoint$.subscribe(() => this.breakpointChanged ());
  }
  readonly breakpoint$ = this.breakpointObserver
  .observe([
    Breakpoints.Large,
    Breakpoints.Medium,
    Breakpoints.Small,
    '(min-width: 500px)',
  ])
  .pipe(distinctUntilChanged());
  ngOnInit(): void {
 
    const url = this.activatedRoute.snapshot["_routerState"].url;
  
    if (this.selectedFunction == 1) {
      this.odinMenu = [
        { label: `Dashboard`, disabled: false ,routerLink:'/'+routeLinks.odin2LandingDashboard,target:'_self'},
        // { label: `Analysis`, disabled: false, routerLink: '/' + routeLinks.odin2Timelineview, target: '_self' },
        { label: `Raw Data`, disabled: false, routerLink: '/' + routeLinks.rawdataV2, target: '_self' }
      ];
    }

    else {
      this.odinMenu = [
        { label: `Dashboard`, disabled: false,routerLink:'/'+routeLinks.odin2CompletionLandingDashboard,target:'_self' },
        // { label: `Analysis`, disabled: false,   routerLink: '/'+routeLinks.completiontimelineviewV2, target: '_self' },
        { label: `Assembly`, disabled: false, routerLink: '/' + routeLinks.odin2Assembly, target: '_self' }       
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
