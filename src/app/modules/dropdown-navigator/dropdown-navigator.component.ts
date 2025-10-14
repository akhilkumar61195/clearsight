import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AppHeaderDropdownList, routeLinks, UserRoleEnum } from '../../common/enum/common-enum';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services';
import { PRIME_IMPORTS } from '../../shared/prime-imports';
import { CommonService } from '../../services/common.service';
import StorageService from '../../services/storage.service';

@Component({
  selector: 'app-dropdown-navigator',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './dropdown-navigator.component.html',
  styleUrl: './dropdown-navigator.component.scss'
})
export class DropdownNavigatorComponent implements OnInit {


  filteredDropdownOptions: any[] = [];
  selectedOption: string | null = null;
  constructor(private router: Router, private authService: AuthService, private commonService: CommonService) {


  }

  ngOnInit(): void {
    this.setSelectedOption(this.router.url);
    this.loadDropdownOptions();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.setSelectedOption(event.urlAfterRedirects);
      });
  }
  /**
   * it will get logged in user accessable application only
   * @param apiAppList 
   */
  loadDropdownOptions() {
    const permissions =StorageService.getUserPermission();; // adapt if it's a signal

    const permissionNames = Array.isArray(permissions)
      ? permissions.map(item => item.permissionName.toUpperCase())
      : [];

    this.filteredDropdownOptions = AppHeaderDropdownList.filter(option =>
      permissionNames.includes(option.label.toUpperCase())
    );

  }
  
  setSelectedOption(currentRoute: string): void {
    // Match the current route with dropdown options
    if (currentRoute === '/odin/dashboard/dashboarddrilling') {
      this.selectedOption = routeLinks.odinDrillingDashboard3;
    } else if (currentRoute === '/thor/thordashboard') {
      this.selectedOption = routeLinks.thor2LandingDashboard;
    } else if (currentRoute === '/mdl') {
      this.selectedOption = routeLinks.mdlDashboard;
    } else if (currentRoute === '/schematic') {
      this.selectedOption = routeLinks.schematicDashboard;
    } else if (currentRoute === '/admin') {
      this.selectedOption = routeLinks.adminDashboard;
    } else if (currentRoute === '/tyr/tyr2Dashboard') {
      this.selectedOption = routeLinks.tyrLandingDashboard;
    } else {
      const matchingOption = this.filteredDropdownOptions.find(option => option.value === currentRoute);
      if (matchingOption) {
        this.selectedOption = matchingOption.value;
      }
    }
  }
  navigateToPage(route: string): void {
    if (route) {
      this.router.navigate([route]);
      console.log(route);

    }
  }

}
