import { ChangeDetectorRef, Component, effect, Input, Signal } from '@angular/core';
import { Subscription } from 'rxjs';;
import { SearchFilterService } from '../../../../services/search-filter.service';
import { AuthService } from '../../../../services';
import { WellheadOrdersService } from './builder/wellhead-orders.service';
import { ColumnConfigBuilder } from './builder/column.config';
import { CommonService } from '../../../../services/common.service';
import { AccessControls } from '../../../../common/constant';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { CustomDialogComponent } from '../../../common/custom-dialog/custom-dialog.component';

@Component({
  selector: 'app-wellhead-orders',
  standalone:true,
  imports:[PRIME_IMPORTS,
    CustomDialogComponent
  ],
  templateUrl: './wellhead-orders.component.html',
  styleUrl: './wellhead-orders.component.scss'
})
export class WellheadOrdersComponent {

  searchTerm: string = '';
  selectedOption: string = '';
  totalRecords: number = 0;
  @Input() dropdownValue: string = '';
  columnDefs: any[] = [];
  gridOptions: any = {
    api: null,
    columnApi: null,
    overlayLoadingTemplate: '<span class="my-custom-loader">Loading data...</span>'
  };
  filterSubscription: Subscription;
  showEditConfirmationDialog: boolean = false;
  userDetail: any;
  filterData: any;



  constructor(
    private searchFilterService: SearchFilterService,
    public wellheadOrdersService: WellheadOrdersService,
    private authService: AuthService,
    private commonService: CommonService,
  ) {
    this.userDetail = this.authService.getUserDetail();
    effect(() => {
      this.filterData = this.wellheadOrdersService.filteredMaterials();
      this.totalRecords = this.filterData?.length;

    })
  }

  // Automatically filters materials when input properties change
  ngOnChanges(): void {
    this.wellheadOrdersService.filterMaterials();
     this.getUserDetails();// Set user access control info
  }

  // Initializes component: subscribes to search filter updates and sets up grid columns
  ngOnInit(): void {

   
    // Subscribe to the filter observable to reactively update the search state
    this.filterSubscription = this.searchFilterService.filter$.subscribe(({ text, option }) => {
      this.searchTerm = text;
      this.selectedOption = option;
      // this.filterGrid();
    });


  }

  // Sets grid APIs, resizes columns to fit, and loads initial data when the grid is ready
  onGridReady(event: any): void {
    this.gridOptions.api = event.api;
    this.gridOptions.columnApi = event.columnApi;
    setTimeout(() => {
      event.api.sizeColumnsToFit();
    }, 0);
  }
  // Retrieves and sets user access control info using the AuthService
   getUserDetails() {
    let userAccess =  this.authService.isAuthorized(AccessControls.WELL_HEAD_ORDER);
    this.commonService.setuserAccess(userAccess);
    // Create column definitions using the builder and auth context
    const builder = new ColumnConfigBuilder(this.authService);
    this.columnDefs = builder.buildColumnDefs();
  }

  // Called when the user attempts to save changes
  // - Triggers a confirmation dialog before proceeding with save logic
  saveChanges() {
    this.showEditConfirmationDialog = true;
  }
onUpdateDetails(){
  this.wellheadOrdersService.onUpdateDetails();
  this.showEditConfirmationDialog = false;

}
  closeDialog() {
    this.showEditConfirmationDialog = false;
  }

  resetChanges() {
    // console.log('Resetting changes to edited rows');  
  }
  

}
