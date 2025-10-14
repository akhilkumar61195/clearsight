import { Component } from '@angular/core';
import { PwaService } from './services/pwa.service';
import { PrimeNGConfig } from 'primeng/api';
import { fadeAnimation } from './common/animations';
import { LicenseManager } from 'ag-grid-enterprise';
import { PRIME_IMPORTS } from './shared/prime-imports';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [fadeAnimation]
})
export class AppComponent {
  title = 'Chevron Drilling';

  constructor(private primengConfig: PrimeNGConfig, public pwaService: PwaService) {
    // LicenseManager.setLicenseKey("[TRIAL]_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-072692}_is_granted_for_evaluation_only___Use_in_production_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_purchasing_a_production_key_please_contact_info@ag-grid.com___You_are_granted_a_{Single_Application}_Developer_License_for_one_application_only___All_Front-End_JavaScript_developers_working_on_the_application_would_need_to_be_licensed___This_key_will_deactivate_on_{14 January 2025}____[v3]_[0102]_MTczNjgxMjgwMDAwMA==405486951c8598d572e8f7139156debf");
    LicenseManager.setLicenseKey("Using_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-075131}_in_excess_of_the_licence_granted_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_changing_this_key_please_contact_info@ag-grid.com___{Crowley_Maritime_Corporation}_is_granted_a_{Single_Application}_Developer_License_for_the_application_{Crowley}_only_for_{5}_Front-End_JavaScript_developers___All_Front-End_JavaScript_developers_working_on_{Crowley}_need_to_be_licensed___{Crowley}_has_been_granted_a_Deployment_License_Add-on_for_{1}_Production_Environment___This_key_works_with_{AG_Charts_and_AG_Grid}_Enterprise_versions_released_before_{15_January_2026}____[v3]_[0102]_MTc2ODQzNTIwMDAwMA==6b228c1f5c8882ae3c70d42a809f6236");
  }

  ngOnInit() {
    this.primengConfig.ripple = true;
  }

}
