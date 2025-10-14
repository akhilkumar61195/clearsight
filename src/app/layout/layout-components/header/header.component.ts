import { DOCUMENT } from '@angular/common';
import { Component, effect, Inject, OnDestroy, OnInit, ViewEncapsulation, WritableSignal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import StorageService from '../../../services/storage.service';
import {
  UserRoleEnum,
  routeLinks,
  OdinMenuType,
  NotificationGroup,
  RawDataVisualizations,
  AuthenticationSession,
  TYRMenuType,
  AllApplications,
} from '../../../common/enum/common-enum';
import { hasRole } from '../../../common/general-methods';
import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  IOdinFilterPayloadStore,
  IThorFilterPayloadStore,
  OdinAdvanceFilterAction,
  OdinAdvanceFilterActionType,
  READ_ODIN_ADVANCE_FILTER_ACTION_TYPE,
  READ_THOR_ADVANCE_FILTER_ACTION_TYPE,
  ThorAdvanceFilterAction,
  ThorAdvanceFilterActionType,
} from '../../../common/ngrx-store';
import { Store } from '@ngrx/store';
import { InventoryService } from '../../../services/inventory.service';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { SchematicService } from '../../../services/schematic.service';
import { SchematicSelection } from '../../../common/model/schematic-selection';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { CommonService } from '../../../services/common.service';
import { LookupsService } from '../../../services/lookups.service';
import { WellInfo } from '../../../common/model/well-info';
import { combineLatest, interval, Subscription } from 'rxjs';
import { ThorSelectedWells } from '../../../common/model/thor-selected-wells';
import { AdvanceFilterModel } from '../../../common/model/AdvanceFilterModel';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { AccessControls } from '../../../common/constant';
import { UserService } from '../../../services/user.service';
import { SelectedWellBuilderService } from '../../../modules/tyr2/services/selected-well-builder.service';
import { ChatService } from '../../../services/chat.service';
import { NotificationHubService } from '../../../services/notificationHub.service';
import { ListEditorBuilderService } from '../../../modules/common/builders/list-editor-builder.service';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { BreadcrumbComponent } from '../../../modules/breadcrumb/breadcrumb.component';
import { DropdownNavigatorComponent } from '../../../modules/dropdown-navigator/dropdown-navigator.component';
import { NotificationGroupArray } from '../../../common/model/notification';
import { UserApplicationPermission } from '../../../common/model/userApplicationPermission';
import { TimeDifferencePipe } from './time-difference.pipe';

@Component({
  selector: 'app-layout-header',
  standalone: true,
  imports: [...PRIME_IMPORTS, BreadcrumbComponent,
    DropdownNavigatorComponent, TimeDifferencePipe
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('inOutAnimation', [
      state('in', style({ opacity: 1 })),
      transition(':enter', [
        animate(
          300,
          keyframes([
            style({ opacity: 0, offset: 0 }),
            style({ opacity: 0.25, offset: 0.25 }),
            style({ opacity: 0.5, offset: 0.5 }),
            style({ opacity: 0.75, offset: 0.75 }),
            style({ opacity: 1, offset: 1 }),
          ])
        ),
      ]),
      transition(':leave', [
        animate(
          300,
          keyframes([
            style({ opacity: 1, offset: 0 }),
            style({ opacity: 0.75, offset: 0.25 }),
            style({ opacity: 0.5, offset: 0.5 }),
            style({ opacity: 0.25, offset: 0.75 }),
            style({ opacity: 0, offset: 1 }),
          ])
        ),
      ]),
    ]),
    trigger('slideAnimation', [
      state('in', style({ opacity: 1 })),
      state('out', style({ opacity: 1 })),
      transition('in => out', [
        animate(
          300,
          keyframes([
            style({ opacity: 0, offset: 0 }),
            style({ opacity: 0.25, offset: 0.25 }),
            style({ opacity: 0.5, offset: 0.5 }),
            style({ opacity: 0.75, offset: 0.75 }),
            style({ opacity: 1, offset: 1 }),
          ])
        ),
      ]),
      transition(':leave', [
        animate(
          300,
          keyframes([
            style({ opacity: 1, offset: 0 }),
            style({ opacity: 0.75, offset: 0.25 }),
            style({ opacity: 0.5, offset: 0.5 }),
            style({ opacity: 0.25, offset: 0.75 }),
            style({ opacity: 0, offset: 1 }),
          ])
        ),
      ]),
    ]),
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  items: MenuItem[] | undefined;
  appItems: MenuItem[] | undefined;
  userName: string = StorageService.getDecodedTokenValues()?.fullName;
  currentPage: string = '';
  currentMenuPage: string = '';
  currentSchemanticMenuPage: string = '';
  otherPages: MenuItem[] = [];
  sidebarVisible: boolean = false;
  isOdin: boolean = false;
  isOdin2: boolean = false;
  isOdin3: boolean = false;
  isSchematic: boolean = false;
  isTyr: boolean = false;
  isThor2: boolean = false;
  actualRoute: any;
  listNotification: any[] = [];
  tabMenuList: any[] = [];
  wellDetails: any = {};
  functionId: number;
  userDetail: any;
  visualizations = RawDataVisualizations;
  selectedVisualization: RawDataVisualizations;
  schematic: Completionschematicheader;
  schematicId: number;
  selectedWellNumber: number;
  selectedSchematicId: number;
  previousSchematicId: number;
  private wellNumberSubscription: Subscription;
  routeSubscription: Subscription;
  selectedWell: ThorSelectedWells;
  private wellSubscription: Subscription;
  schematicNotificationMessage: string;
  permissionSignal: UserApplicationPermission[];
  private lastSelectedPage: string[] = []; // to track last two distinct selected pages
  notificationRefreshSubscription: Subscription; // it will refresh the notifcations
  storeFunctionId: WritableSignal<number> =
    this.selectedWellBuilderService.functionId; // Adding the functionId set in tyr 
  notifications: string[] = [];
    notificationGroups: NotificationGroupArray[] = [
    {
      title: AllApplications.odin,
      key: NotificationGroup.Odin,
    },
    {
      title: AllApplications.thor,
      key: NotificationGroup.Thor,
    },
    {
      title: AllApplications.tyr,
      key: NotificationGroup.Tyr,
    },
    {
      title: AllApplications.schematic,
      key: NotificationGroup.Schematic,
    },
    {
      title: AllApplications.mdl,
      key: NotificationGroup.Mdl,
    },

  ];

  isTyrListEditorActive(): boolean {
    // Checks if the current route contains 'list-editor' or invoices
    return this.router.url.includes(routeLinks.tyrListEditorLabel) || this.router.url.includes(routeLinks.invoice) || this.router.url.includes(routeLinks.inbox);
  }
  ngOnInit() {
  
    this.items = [
      {
        label: this.userName,
        icon: 'pi pi-fw usr-icon h-w-28',
        items: [
          {
            label: 'My account',
            icon: 'pi pi-fw usr-icon',
            command: () => this.profile(),
          },
          {
            separator: true,
          },
          {
            label: 'Logout',
            icon: 'pi pi-fw logout-icon',
            command: () => this.logout(),
          },
        ],
      },
    ];
    this.notificationHubService.notification$.subscribe(message => {
      this.getAllNotification(); // receiving notification instantly
    });
    this.getUserPersonaDetails();
    // Refresh notifications every 5 seconds
    // this.notificationRefreshSubscription = interval(5000).subscribe(() => {
    //   this.getAllNotification();
    // });
    this.completionSchematicService.selectedSchematic$.subscribe(schematicId => {
      this.selectedSchematicId = schematicId ? schematicId : this.currentSchemanticMenuPage;
      this.getSchematicDetails();
    });

    this.wellNumberSubscription = combineLatest([
      this.commonService.selectedWellNumber$.pipe(filter(wellNumber => wellNumber > 0)),
      this.commonService.functionId$.pipe(filter(functionId => functionId != null))
    ]).subscribe(([wellNumber, functionId]) => {
      this.selectedWellNumber = wellNumber;
      this.functionId = functionId;
      this.getWellDetails();
    });

    this.wellSubscription = this.commonService.thorSelectedWellObject$.subscribe((well: ThorSelectedWells) => {
      if (well && well.wellId > 0) {
        this.selectedWell = well;
        this.getWellDetails(); // Call the function when new well data arrives
      }
    });

    this.routeSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.clearWellData();
      }
    });
  }

  onVisualizationChange() {
    localStorage.setItem('selectedVisualization', this.selectedVisualization);
  }

  removeItem(i: any, item: any) {
    const userId = +this.userDetail.uid;
    this.dismissNotification(item?.id, userId);
  }

  constructor(
    @Inject(DOCUMENT) readonly document: Document,
    private router: Router,
    private messageService: MessageService,
    private activatedRoute: ActivatedRoute,
    public inventoryService: InventoryService,
    private notificationService: NotificationService,
    private schematicService: SchematicService,
    private completionSchematicService: CompletionschematicService,
    private commonService: CommonService,
    private lookupsService: LookupsService,
    private authService: AuthService,
    private userService: UserService,
    private thorStore: Store<{ thorAdvanceFilterData: IThorFilterPayloadStore }>,
    private odinStore: Store<{ odinAdvanceFilterData: IOdinFilterPayloadStore }>,
    private selectedWellBuilderService: SelectedWellBuilderService,
    private notificationHubService: NotificationHubService,
    private listEditorBuilderService: ListEditorBuilderService,
    private configurationValuesService: ConfigurationValuesService

  ) {
    router.events.pipe(filter((e) => e instanceof NavigationEnd), distinctUntilChanged())
      .subscribe((data: NavigationEnd) => {
        this.currentPage = data.url.split('/')[1];
        this.permissionSignal=StorageService.getUserPermission();
        const { lastSelectedPage, currentPage } = this;

        // Used to track last two distinct selected pages
        if (!lastSelectedPage.includes(currentPage)) {
          if (lastSelectedPage.length >= 2) {
            lastSelectedPage.shift(); // remove oldest entry
          }
          lastSelectedPage.push(currentPage);
        }

        const isValid = this.isValidApplication(currentPage);
        // Used when the tabs are switched between the same app
        const hasDistinctTwo =
          (lastSelectedPage.length === 2 &&
            lastSelectedPage[0] !== lastSelectedPage[1]) ||
          lastSelectedPage.length === 1;

        // Calling getAll app id only when the application is valid and the last two selected pages are distinct
        if (isValid && hasDistinctTwo) {
          this.getSelectedApplicationId(currentPage);
        }
        this.currentMenuPage = data.url.split('/')[2];
        this.currentSchemanticMenuPage = data.url.split('/')[3];
        this.setAppDD();
        this.isOdin = this.currentPage == routeLinks.odinDashboard;
        this.isOdin2 = this.currentPage == routeLinks.odin2Dashboard;
        this.isOdin3 = this.currentPage == routeLinks.odin3;
        this.isSchematic = this.currentPage == routeLinks.schematicDashboard;
        this.isTyr = this.currentPage == routeLinks.tyrDashboard;
        this.userDetail = this.authService.getUserDetail();
        /**
         * show tab menu on center of header if have tab menu list, @see app-routing.module.ts
        */
       this.tabMenuList = (this.activatedRoute.snapshot.firstChild.data?.tabMenu ?? []);
      });
      effect(() => {
        this.functionId = this.storeFunctionId();
    });
  }

  // Check if the application is there in the enum
  isValidApplication(selectedPage: string): boolean {
    return selectedPage.toLowerCase() in AllApplications;
  }

  
// Set AppID
  getSelectedApplicationId(selectedPage: string) {
    let appId: number = null;
    this.lookupsService.getListEditorApplications().subscribe({ // Changing the api call from configurationValuesService to lookupsService, prev api's data had mismatching the appIds
      next:(data) => {
        appId =  (data?.find((appData) => appData?.applicationName.toLowerCase() === selectedPage))?.id;
        this.listEditorBuilderService.selectedApplicationId.set(appId);
      },
      error: (error) => {
      //  this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to get Application list' });
        console.error('Error adding record', error);
      }
    });
  }

  setAppDD() {
   
    let otherPages: MenuItem[] = [];
    if (this.permissionSignal.length > 1) {
      const isMorethen1 = this.permissionSignal.length > 2;
      let isIconAdded: boolean = false;
      let isSeperatorAdded: boolean = false;

      if (
        this.currentPage != routeLinks.odinDrillingDashboard3 &&
        this.currentPage != routeLinks.odinCompletionDashboard3 &&
        hasRole(this.permissionSignal,UserRoleEnum.Odin)
      ) {
        otherPages.push({
          label: routeLinks.odinDashboard.toUpperCase(),
          icon: 'pi pi-fw pi-arrow-right',
          command: () => this.router.navigate([routeLinks.odinDashboard3]),
        });
        isIconAdded = true;
      }
      // if (
      //   //this.currentPage != routeLinks.odinDashboard &&
      //   hasRole(UserRoleEnum.Odin)
      // ) {
      //   otherPages.push({
      //     label: 'ODIN P1',
      //     icon: 'pi pi-fw pi-arrow-right',
      //     command: () => this.router.navigate([routeLinks.odinDashboard]),
      //   });
      //   isIconAdded = true;
      // }
      //if (
      //  this.currentPage != routeLinks.odin2LandingDashboard &&
      //  hasRole(UserRoleEnum.Odin)
      //) {
      //  otherPages.push({
      //    label: routeLinks.odin2Dashboard.toUpperCase(),
      //    icon: 'pi pi-fw pi-arrow-right',
      //    command: () => {
      //      this.resetOdinState();
      //      this.router.navigate([routeLinks.odin2LandingDashboard])
      //    }              ,
      //  });
      //  isIconAdded = true;
      //}

      //if (
      //  this.currentPage != routeLinks.odinDashboard3 &&
      // hasRole(UserRoleEnum.Odin)
      //) {
      // otherPages.push({
      //   label: routeLinks.odin3.toUpperCase(),
      //   icon: 'pi pi-fw pi-arrow-right',
      //   command: () => {
      //     this.resetOdinState();
      //     this.router.navigate([routeLinks.odinDashboard3])
      //   }              ,
      // });
      // isIconAdded = true;
      //}

      if (isIconAdded && isMorethen1 && !isSeperatorAdded) {
        otherPages.push({
          separator: true,
        });
        isSeperatorAdded = true;
      }

      // if (
      //   this.currentPage != routeLinks.thorDashboard &&
      //   hasRole(UserRoleEnum.Thor)
      // ) {
      //   otherPages.push({
      //     label: 'THOR P1',
      //     icon: 'pi pi-fw pi-arrow-right',
      //     command: () => this.router.navigate([routeLinks.thorDashboard]),
      //   });
      //   isIconAdded = true;
      // }




      if (
        this.currentPage != routeLinks.thor2Dashboard &&
        hasRole(this.permissionSignal,UserRoleEnum.Thor)
      ) {
        otherPages.push({
          label: 'THOR',
          icon: 'pi pi-fw pi-arrow-right',
          command: () => {
            // this.resetThor2State();
            this.router.navigate([routeLinks.thor2LandingDashboard]);
          }
        });
        isIconAdded = true;
        this.wellDetails.id = null; // Clear wellId when switching to Completions
        this.commonService.setWellDetailsFilterData(this.wellDetails);
      }

      if (isIconAdded && isMorethen1 && !isSeperatorAdded) {
        otherPages.push({
          separator: true,
        });
      }

      if (
        this.currentPage != routeLinks.tyrDashboard &&
        hasRole(this.permissionSignal,UserRoleEnum.TYR)
      ) {
        otherPages.push({
          label: routeLinks.tyrDashboard.toUpperCase(),
          icon: 'pi pi-fw pi-arrow-right',
          command: () => this.router.navigate([routeLinks.tyrDashboard]),
        });
      }

      if (
        this.currentPage != routeLinks.mdlDashboard &&
        hasRole(this.permissionSignal,UserRoleEnum.Mdl)
      ) {
        otherPages.push({
          label: routeLinks.mdlDashboard.toUpperCase(),
          icon: 'pi pi-fw pi-arrow-right',
          command: () => this.router.navigate([routeLinks.mdlDashboard]),
        });
      }

      if (
        this.currentPage != routeLinks.schematicDashboard &&
        hasRole(this.permissionSignal,UserRoleEnum.Schematic)
      ) {
        otherPages.push({
          label: routeLinks.schematicDashboard.toUpperCase(),
          icon: 'pi pi-fw pi-arrow-right',
          command: () => this.router.navigate([routeLinks.schematicDashboard]),
        });
      }
    }
    this.appItems = [
      {
        label: this.currentPage,
        items: otherPages,
      },
    ];
  }

  logout = async () => {
    this.deleteAllCookies();
    this.router.navigateByUrl(routeLinks.login);
  };

  resetOdinState() {
    const advanceFilter = new AdvanceFilterModel();
    advanceFilter.projects = [];
    advanceFilter.functions = 1;
    advanceFilter.timeline = "";
    advanceFilter.wells = [];
    let reducerObject: any;
    reducerObject = new OdinAdvanceFilterAction(null);
    reducerObject.payload = JSON.parse(JSON.stringify(advanceFilter));
    reducerObject.type = READ_ODIN_ADVANCE_FILTER_ACTION_TYPE as OdinAdvanceFilterActionType;
    reducerObject.payload['reset'] = true
    this.odinStore.dispatch(reducerObject);
  }

  resetThor2State() {
    this.commonService.clearSelectedWellNumber();
    if (this.wellSubscription) {
      this.wellSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }

  }
  MenuSelection(menuType: string) {

    switch (menuType) {
      case OdinMenuType.WhatIf:
        this.router.navigateByUrl(routeLinks.whatIf);
        break;
      case OdinMenuType.DemandConsumption:
        this.router.navigateByUrl(routeLinks.demandConsumption);
        break;
      case OdinMenuType.RawData:
        this.router.navigateByUrl(routeLinks.rawdata);
        break;
      case OdinMenuType.DemandValuation:
        this.router.navigateByUrl(routeLinks.demandValuation);
        break;
      case OdinMenuType.InventoryRead:
        this.router.navigateByUrl(routeLinks.inventoryRead);
        break;
      case OdinMenuType.TimeLineView:
        this.router.navigateByUrl(routeLinks.timeLineView);
        break;
      case OdinMenuType.Dashboard:
        this.router.navigateByUrl(routeLinks.odinDashboard);
        break;
      case OdinMenuType.CompletionDashboard:
        this.router.navigateByUrl(routeLinks.odinCompletionLandingDashboard);
        break;
      case OdinMenuType.CompletionTimeLineView:
        this.router.navigateByUrl(routeLinks.completiontimelineview);
        break;

      case OdinMenuType.Odin2WhatIf:
        this.router.navigateByUrl(routeLinks.odin2WhatIf);
        break;
      case OdinMenuType.Odin2DemandConsumption:
        this.router.navigateByUrl(routeLinks.demandConsumptionV2);
        break;
      case OdinMenuType.Odin2RawData:
        this.router.navigateByUrl(routeLinks.rawdataV2);
        break;
      case OdinMenuType.Odin2DemandValuation:
        this.router.navigateByUrl(routeLinks.demandValuationV2);
        break;
      case OdinMenuType.Odin2InventoryRead:
        this.router.navigateByUrl(routeLinks.inventoryRead);
        break;
      case OdinMenuType.Odin2TimeLineView:
        this.router.navigateByUrl(routeLinks.odin2Timelineview);
        break;
      case OdinMenuType.Odin2Dashboard:
        this.router.navigateByUrl(routeLinks.odin2LandingDashboard);
        break;
      case OdinMenuType.Odin2CompletionDashboard:
        this.router.navigateByUrl(routeLinks.odin2CompletionLandingDashboard);
        break;
      case OdinMenuType.Odin2CompletionTimeLineView:
        this.router.navigateByUrl(routeLinks.completiontimelineviewV2);
        break;
      case OdinMenuType.Odin3Dashboard:
        this.router.navigateByUrl(routeLinks.odinDashboard3);
        break;
      case OdinMenuType.odinRawdata3:
        this.router.navigateByUrl(routeLinks.odinRawdata3);
        break;
      case OdinMenuType.odinCompletionRawdata3:
        this.router.navigateByUrl(routeLinks.odinCompletionRawdata3); // completion raw data
        break;
      case OdinMenuType.Odin3CompletionDashboard:
        this.router.navigateByUrl(routeLinks.odinCompletionDashboard3);
        break;
      case OdinMenuType.Odin3Assembly:
        this.router.navigateByUrl(routeLinks.odin3Assembly);
        break;
      case OdinMenuType.Odin3DemandConsumption:
        this.router.navigateByUrl(routeLinks.demandConsumptionV3);
        break;
      case OdinMenuType.Wellhead:
        this.router.navigateByUrl(routeLinks.wellhead);
        break;
      case TYRMenuType.TYR2Dashboard:
        this.router.navigateByUrl(routeLinks.tyrLandingDashboard);
        break;
      case TYRMenuType.Invoice:
        this.router.navigateByUrl(routeLinks.tyr2Invoice);
        break;
      case TYRMenuType.Inbox:
        this.router.navigateByUrl(routeLinks.tyr2Inbox);
        break;
      case TYRMenuType.ListEditor:
        this.router.navigateByUrl(routeLinks.tyrListEditor);
        break;
      case UserRoleEnum.Odin:
        this.router.navigateByUrl('/odin/dashboard');
        break;
       case UserRoleEnum.Thor:
        this.router.navigateByUrl('/thor');
        break;
        case UserRoleEnum.Mdl:
        this.router.navigateByUrl('/mdl');
        break;
      case UserRoleEnum.Schematic:
        this.router.navigateByUrl('/schematic');
        break;
      case UserRoleEnum.Admin:
        this.router.navigateByUrl('/admin');
        break;

      default:
        this.router.navigateByUrl(routeLinks.login);
    }
    this.currentMenuPage = menuType;
    this.sidebarVisible = false;
  }

  deleteAllCookies() {
    localStorage.clear();
    var cookies = this.document.cookie.split(';');

    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var eqPos = cookie.indexOf('=');
      var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      this.document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }
  profile() { }

  //Notification Section
  async getAllNotification() {

    const personaId = +this.userDetail.personaName;
    const userId = +this.userDetail.uid;
    this.notificationService.getNotifications(personaId, userId).subscribe({
      next: (resp: any) => {
        if (resp) {
          this.listNotification = resp;
        } else {
          this.listNotification = []
        }
      },
      error: () => { },
    });
  }

  /**
   * remove the notification from the notification panel
   * @param transactionId 
   * @param userId 
   */
  dismissNotification(transactionId: number, userId: number) {
    this.notificationService.dismissNotifications(transactionId, userId).subscribe({
      next: (resp: any) => {
        if (resp) {
          this.getAllNotification();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: resp.message,
          });
        }
      },
      error: () => { },
    });
  }

  getNotificationAuditData(item: any) {
    // Adding changes to call function based on apps
    if (item.appTo === NotificationGroup.Thor || item.appTo === NotificationGroup.Odin) {
          let payload: any = {
      searchTerms: '',
      sortBy: 'NotificationTransactionId',
      sortDescending: true,
      searchConditions: []
    };
    this.inventoryService.getNotificationAuditData(payload, item?.id).subscribe({
      next: (resp: any) => {
        if (resp && resp.success && resp.data) {
          let obj = {
            item: item,
            auditData: resp.data
          };
          this.goToWatch(obj);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: resp.message,
          });
        }
      },
      error: () => { },
    });
    } else if (item.appTo === NotificationGroup.Tyr) {
        this.goToTyr();
    } else if (item.appTo === NotificationGroup.Schematic) {
        this.goToSchmatic();
    }
  }

  goToWatch(data: any) {
    switch (data.item.transactionType) {
      case NotificationGroup.Thor:
        this.goToThor(data);
        break;

      default:
        break;
    }
  }

  goToThor(data) {
    let thorFilter: any = {};
    thorFilter['globalSearch'] = '';
    thorFilter['projects'] = [];
    thorFilter['functions'] = [];
    thorFilter['well'] = data.item.wellId;
    let reducerObject = new ThorAdvanceFilterAction(null);
    reducerObject.payload = JSON.parse(JSON.stringify(thorFilter));
    reducerObject.type =
      READ_THOR_ADVANCE_FILTER_ACTION_TYPE as ThorAdvanceFilterActionType;
    this.thorStore.dispatch(reducerObject);
    this.router.navigate([
      routeLinks.thorLandingDashboard,
      { queryParams: JSON.stringify({ notification: JSON.stringify(data) }) },
    ]);
  }

  getGroupByNotification(group: string) {

    const userDetails = this.authService.getUserDetail();

    return this.listNotification.filter((x) => {
      // Base condition to check whether the notification is valid for the given group
      let isValid = false;

      // Schematic group: Check for 'Schematic' appTo and Pending Approval / Rejected message types
      if (group === 'Schematic') {
        isValid =
          x.appTo === group &&
          (x.messageType === 'Pending Approval' ||
            x.messageType === 'Rejected');
      }

      // Odin group: Check for Approved message type
      else if (group === 'Odin') {
        isValid = x.messageType === 'Approved';
      }

      // Tyr group: Check for Tyr as appTo
      else if (group === 'Tyr') {
        isValid = x.appTo === 'Tyr';
      }

      // Default case: Check if transactionType matches the group
      else {
        isValid = x.transactionType === group;
      }
      return isValid;
    });
  }
  getSchematicDetails() {
    if (this.selectedSchematicId != undefined && !isNaN(this.selectedSchematicId)) {
      this.completionSchematicService.getSchematicHeaderById(+this.selectedSchematicId).subscribe(
        {
          next: (data) => {
            if (data && data.schematicsName) {
              this.schematic = data;
              this.schematicId = this.schematic.schematicsID;
            }
          },
          error: (error) => {
            console.error('Error fetching schematic data', error);
          }
        }
      );
    }
  }


  getWellDetails() {
    if (!this.selectedWell || this.selectedWell.wellId <= 0) {
      return;
    }

    this.lookupsService.getWellsById(
      this.selectedWell.wellId,
      this.selectedWell.appId,
      this.selectedWell.functionId
    ).subscribe({
      next: (wells) => {
        this.wellDetails = wells;
        this.commonService.setSchemanticId(this.wellDetails.schematicId);
      },
      error: (err) => {
        console.error('Error fetching well details:', err);
        this.wellDetails = {};
      },
    });
  }

  clearWellData() {
    if (!this.selectedWellNumber) {
      return; // Avoid unnecessary resets
    }
    // this.selectedWell = null;
    this.selectedWellNumber = null;
    this.wellDetails = {};
    this.commonService.clearSelectedWellNumber();
  }

  ngOnDestroy(): void {
    if (this.wellSubscription) {
      this.wellSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    // Unsubscribe from notification interval
    if (this.notificationRefreshSubscription) {
      this.notificationRefreshSubscription.unsubscribe();
    }
  }
  goToSchmatic() {
    this.router.navigate([
      routeLinks.schematicDashboard]);
  }
  goToTyr() {
    this.router.navigate([
      routeLinks.tyrDashboard]);
  }
  /**
   *  it will get the user details from jwt token
   */
  getUserPersonaDetails() {
    const userDataByToken = this.authService.getUserDetail();
    this.userService.getUserPersonasSetting(+userDataByToken.uid).subscribe({
      next: (resp: any) => {

        StorageService.set(AuthenticationSession.PERSONA_SETTING, resp);

      },
      error: (error: any) => {

      }
    });

  }
}

