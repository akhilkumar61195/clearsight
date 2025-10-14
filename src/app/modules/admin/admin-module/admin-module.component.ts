import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth.service';
import { GridStatePersistenceService } from '../../../common/builder/persistant-builder.service';
import { CustomerPersonalizationService } from '../../../services/customer-personalization.service';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { ConfigurationValues } from '../../../common/model/configuration-values';
import { hasRole } from '../../../common/general-methods';
import { UserRoleEnum } from '../../../common/enum/common-enum';
import { ApplicationPermission } from '../../../common/model/applicationPersmissionModel';
import { PersonaInfo } from '../../../common/model/personaInfo';
import { AdminTabComponent } from '../admin-tab/admin-tab.component';
import { InteractiveToolbarComponent } from '../../common/interactive-toolbar/interactive-toolbar.component';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { CustomDialogComponent } from '../../common/custom-dialog/custom-dialog.component';
import { DeleteConfirmationDialogComponent } from '../../common/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { SYSTEM } from '../../../common/constant';
import { AddUserDialogComponent } from '../add-user-dialog/add-user-dialog.component';
import StorageService from '../../../services/storage.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-admin-module',
  standalone: true,
  imports: [AdminTabComponent,InteractiveToolbarComponent,CustomDialogComponent,DeleteConfirmationDialogComponent,
    ...PRIME_IMPORTS, AddUserDialogComponent
  ],
  templateUrl: './admin-module.component.html',
  styleUrls: ['./admin-module.component.scss']
})
export class AdminModuleComponent implements OnInit, OnDestroy {
  // Track the last edited row from ag-Grid
  showCreatePersonaModal = false;
  showCreatePersonaConfirmDialog = false;
  newPersonaName: string = '';
  selectedUserName: string | null = null;
  quickFilterText: string = '';
  adminColumnDefs: any[] = [];
  adminRowData: any[] = [];
  AdminRowData: any[] = [];
  // Personas and Applications
  personasList: PersonaInfo[] = [];
  filteredPersonasList: PersonaInfo[] = [];
  applicationsList: ApplicationPermission[] = [];
  showSaveDialog = false;
  showPersonaModal = false;
  personaModalUser: any = null;
  personaModalSelectedIds: number[] = [];
  adminPersonaRowData: any[] = [];
  userDetail: any;
  showAddUserModal = false;
  showAddUserConfirmDialog = false;
  newUser: any = {};
  isAddUserFormValid = false;
  editedRow: any = null;
  selectedRow: any;
  gridApi: any;
  hasRestoredPersonalization = false;
  readonly stateKey = 'Admin';
  hasAdminAccess: boolean = hasRole(StorageService.getUserPermission(),UserRoleEnum.Admin);
  roleList: Array<ConfigurationValues> = [];
  deleteUserRow: any;
  showDeleteUserDialog: boolean = false;
  private adminSubscribe : Subscription = new Subscription();
  // Tab control
  activeTab: 'personas' | 'applications' = 'personas';
  activeAdminTab: 'personas' | 'applications' = 'personas';

  // filtered list applications
  filteredApplicationsList: ApplicationPermission[] = [];
  personaSearch = '';
  applicationSearch = '';
  filteredPersonas = [];
  filteredApplications = [];
  selectedApplicationIds: number[] = [];   // to track selected applications
  personaRowData: any[] = [];
  applicationRowData: any[] = [];


  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private authService: AuthService,
    private gridStateService: GridStatePersistenceService,
    private personalizationService: CustomerPersonalizationService,
    private configurationValuesService: ConfigurationValuesService,
  ) { }

  ngOnInit(): void {
    this.getRoleList();
    this.loadAdminData();
    this.loadPersonasList();
    // Load applications list
    this.loadApplicationsList();
    this.userDetail = this.authService.getUserDetail();
  }

  
   // Fetches the list of Roles from the configuration values service.
  getRoleList() {
    this.adminSubscribe = this.configurationValuesService.getAllEntities('configvalue', 'PrimaryRole').subscribe({
      next: (response) => {
        this.roleList = response;
      },
      error: (error) => {
        console.error('Error fetching role list:', error);
      }
    });
  }

  onCreateUserClick() {  
    this.showAddUserModal = true;
    this.newUser = { firstName: '', lastName: '', email: '', password: '', primaryRole: '' };
  }

  onAddUserModalClose() {
    this.showAddUserModal = false;
  }


  onCreatePersonaClick() {
    this.showCreatePersonaModal = true;
    this.newPersonaName = '';
  }

  onCreatePersonaModalSaveConfirm() {
    // Show confirmation dialog instead of saving directly
    this.showCreatePersonaConfirmDialog = true;
  }


  closeCreatePersonaConfirmDialog() {
    this.showCreatePersonaConfirmDialog = false;
  }

  onCreatePersonaModalClose() {
    this.showCreatePersonaModal = false;
  }
  // Called when user confirms persona creation in the dialog
  createPersonaConfirmDialog() {    
    const personaDto = {
      personaName: this.newPersonaName,
      createdByUserId: this.userDetail?.uid
    };

    this.adminSubscribe = this.userService.createrPersona(personaDto).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Persona created successfully'
        });
        this.showCreatePersonaModal = false;
        this.showCreatePersonaConfirmDialog = false;
        // Reload personas list to show the new persona
        this.loadPersonasList();
        // Reset the persona name
        this.newPersonaName = '';
      },
      error: (error) => {
        console.error('Error creating persona:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create persona'
        });
      }
    });
  }

  /*
   * Load admin data from the API
   */
  loadAdminData() {
    this.adminSubscribe = this.userService.getUsersList().subscribe(
      (data) => {
        this.adminRowData = data;
        this.AdminRowData = JSON.parse(JSON.stringify(this.adminRowData));
        this.setColumnDefs();
        setTimeout(() => this.getPersonalization(), 50);
      },
      (error) => {
        // handle error
        this.messageService.add({ severity: 'error', summary: error, detail: error.message });

      }
    );
  }
  // Load Personas
loadPersonasList() {
  this.adminSubscribe = this.userService.getPersonasList().subscribe(
    (data) => {
      this.personasList = (data || []).sort((a, b) =>
        a.personaName?.localeCompare(b.personaName)
      );
      this.filteredPersonasList = [...this.personasList]; // show full list by default
    },
    (error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Failed to load personas',
        detail: error.message
      });
    }
  );
}

// Load Applications
loadApplicationsList(): void {
  this.configurationValuesService.getApplicationPermissionList().subscribe(
    (data) => {
      this.applicationsList = (data || []).sort((a, b) =>
        a.applicationName?.localeCompare(b.applicationName)
      );
      this.filteredApplicationsList = [...this.applicationsList]; // show full list by default
      this.filteredApplicationsList = this.filteredApplicationsList.filter(
        item => !(item.applicationName === SYSTEM)
      ); // removed system from the list in admin application tab
    
    },
    (error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Failed to load applications',
        detail: error.message
      });
    }
  );
}

// Handle persona checkbox toggle
onPersonaModalCheck(event: any, personaId: number): void {
  if (event.target.checked) {
    this.personaModalSelectedIds.push(personaId);
  } else {
    this.personaModalSelectedIds = this.personaModalSelectedIds.filter(id => id !== personaId);
  }
}

// Handle application checkbox toggle
onApplicationCheck(event: any, appId: number): void {
  if (event.target.checked) {
    if (!this.selectedApplicationIds.includes(appId)) {
      this.selectedApplicationIds.push(appId);
    }
  } else {
    this.selectedApplicationIds = this.selectedApplicationIds.filter(id => id !== appId);
  }
}
  // Set column definitions for the grid
  setColumnDefs() {
    this.adminColumnDefs = [
      { headerName: 'UserID/Email', field: 'emailAddress', editable: this.hasAdminAccess  },
      { headerName: 'First Name', field: 'firstName', editable: this.hasAdminAccess },
      { headerName: 'Last Name', field: 'lastName', editable: this.hasAdminAccess },
      { 
        headerName: 'Primary Role', 
        field: 'primaryRole', 
        editable: this.hasAdminAccess,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: this.roleList.map(role => role.id)
        },
        valueFormatter: (params: any) => {
          const role = this.roleList.find(r => r.id === params.value);
          return role ? role.value : params.value;
        }
      },
      {
        headerName: 'Action',
        field: 'action',
        valueGetter: () => '',
        cellRenderer: () => {
          return `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; gap: 6px;">
              <button pButton type="button" class="p-ripple p-element chv-light-blue-btnsm p-button p-component custom-button-class delete-bg-transparent" data-action="add">
                <i class="pi pi-plus-circle add-button-icon pr-2" data-action="add"></i>
              </button>
              <button pButton type="button" class="p-ripple p-element chv-red-btnsm p-button p-component custom-button-class delete-bg-transparent" data-action="delete">
                <i class="pi pi-trash delete-button-icon pr-2" data-action="delete"></i>
              </button>
            </div>
          `;
        },
        editable: false,
        cellClass: 'action-button-add',
        filter: false,
        maxWidth: 200,
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
        onCellClicked: (params: any) => {
          // Determine which button was clicked
          const event = params.event;
          const target = event?.target;
          if (target) {
            const action = target.getAttribute('data-action') || (target.closest('button') && target.closest('button').getAttribute('data-action'));
            if (action === 'add') {
              this.onAddAction(params.data);
            } else if (action === 'delete') {
              this.onDeleteAction(params.data);
            }
          }
        }
      }
    ];
  }
// search filter for personas and applications
  filterPersonas() {
  const q = this.personaSearch.toLowerCase();
  this.filteredPersonasList = this.personasList.filter(p => 
    p.personaName.toLowerCase().includes(q)
  );
}

filterApplications() {
  const q = this.applicationSearch.toLowerCase();
  this.filteredApplicationsList = this.applicationsList.filter(a => 
    a.applicationName.toLowerCase().includes(q)
  );
}

  onDeleteAction(row: any): void {
    this.deleteUserRow = row;
    this.showDeleteUserDialog = true;
  }

  onDeleteUserConfirm(): void {
    this.adminSubscribe = this.userService.deleteUser(this.deleteUserRow.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'User Deleted', detail: 'User has been deleted successfully.' });
        this.loadAdminData();
        this.showDeleteUserDialog = false;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error?.error?.message || 'Failed to delete user.' });
        this.showDeleteUserDialog = false;
      }
    });
  }

  closeDeleteUserDialog(): void {
    this.showDeleteUserDialog = false;
  }

  adminPersonaColumnDefs: any[] = [
    { headerName: 'Personas', field: 'personaName', cellStyle: { fontWeight: '500' } }
  ];

  adminApplicationColumnDefs = [
  { headerName: 'Applications', field: 'applicationName',  cellStyle: { fontWeight: '500' }},
];

  // Handler for Action column plus icon
  onAddAction(row: any) {
    this.personaModalUser = row;
    this.loadPersonaWithApplications(row.id);
    this.showPersonaModal = true;
  }

  // Handler for saving persona assignment from modal
  onPersonaModalSave() {
    if (this.personaModalUser) {
      const payload = {
        userId: this.personaModalUser.id,
        personaId: [...this.personaModalSelectedIds],
        applicationIds: [...this.selectedApplicationIds],
        loggedInUserId: this.userDetail?.uid
      };
       this.adminSubscribe = this.userService.updateUserPersona(payload).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Persona Assigned', detail: 'Persona(s) assigned successfully.' });
          this.loadPersonaWithApplications(payload.userId);
          this.showPersonaModal = false;
          this.personaModalUser = null;
          this.personaModalSelectedIds = [];
          this.selectedApplicationIds = [];
          this.loadAdminData();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to assign persona(s).' });
        }
      });
    } else {
      this.showPersonaModal = false;
      this.personaModalUser = null;
      this.personaModalSelectedIds = [];
      this.selectedApplicationIds = [];
    }
  }

  // Handler for closing modal without saving
  onPersonaModalClose() {
    this.showPersonaModal = false;
    // Reset personaModalSelectedIds to assigned personas from API/user object
    if (this.personaModalUser) {
      if (Array.isArray(this.personaModalUser.personaId)) {
        this.personaModalSelectedIds = [...this.personaModalUser.personaId];
      } else if (this.personaModalUser.personaId != null) {
        this.personaModalSelectedIds = [this.personaModalUser.personaId];
      } else {
        this.personaModalSelectedIds = [];
      }
    } else {
      this.personaModalSelectedIds = [];
    }
    this.personaModalUser = null;
  }

  // Global Search for Schematic Records
  onSearch(event: any) {
    this.quickFilterText = event.target.value;
  }

  onRowClicked(event: any) {
    // Find persona for selected user
    const user = event.data;
    if (!user || !user.id) {
      this.adminPersonaRowData = [];
      return;
    }
    this.loadPersonaWithApplications(user.id);
  }

  ngOnDestroy() {
    this.gridStateService.saveStateOnDestroy(this.stateKey);
    this.adminSubscribe.unsubscribe();
  }

  loadPersonaWithApplications(userId: number) {
  this.userService.getPersonaWithPermission(userId).subscribe({
    next: (res: { personaIds: number[], applicationIds: number[] }) => {
      const { personaIds, applicationIds } = res;
       // Save IDs for checkboxes in modal
      this.personaModalSelectedIds = personaIds || [];
      this.selectedApplicationIds = applicationIds || [];

      // Match personaIds with full persona objects
      const matchedPersonas = this.personasList.filter(p =>
        personaIds.includes(p.id)
      );
      this.personaRowData = matchedPersonas;

      // Match applicationIds with full application objects
      const matchedApplications = this.applicationsList.filter(app =>
        applicationIds.includes(app.appid)
      );
      this.applicationRowData = matchedApplications;
    },
    error: (err) => {
      this.personaRowData = [];
      this.applicationRowData = [];
      console.error('Failed to load persona/application permissions', err);
    }
  });
}


  onGridReady(params: any) {
    this.gridApi = params.api;
    // Initialize grid state persistence for admin grid
    this.gridStateService.initialize(params.api, this.userDetail?.uid);
    // Set custom context (selected user, etc.)
    this.gridStateService.setContextData({
      selectedUserId: this.selectedRow?.id || null,
      selectedUserName: this.selectedRow?.emailAddress || null
    });
  }

  onCancel() {
    // Restore the original data
    this.adminRowData = JSON.parse(JSON.stringify(this.AdminRowData));
  }

  // Called when Save is clicked in the toolbar
  onToolbarSaveClick() {
    if (!this.editedRow) {
      this.messageService.add({ severity: 'warn', summary: 'No Changes', detail: 'No row has been edited.' });
      return;
    }
    this.showSaveDialog = true;
  }

  closeSaveDialog() {
    this.showSaveDialog = false;
  }

  onEditRow(row: any) {
    this.editedRow = row;
    this.showSaveDialog = true;
  }

  // ag-Grid cell value change handler
  onCellValueChanged(event: any) {
    this.editedRow = { ...event.data };
  }

  onAddUserModalSaveConfirm() {
    // Prepare payload for createOrUpdateUser
    const payload = {
      id: 0,
      firstName: this.newUser.firstName,
      lastName: this.newUser.lastName,
      emailAddress: this.newUser.email,
      primaryRole: this.newUser.primaryRole,
      password: this.newUser.password,
      userId: this.userDetail.uid // Assuming userId is the current user's ID
    };
     this.adminSubscribe = this.userService.createOrUpdateUser(payload).subscribe({
      next: (res) => {
        this.showAddUserModal = false;
        this.showAddUserConfirmDialog = false;
        this.messageService.add({ severity: 'success', summary: 'User Created', detail: 'User has been created successfully.' });
        this.loadAdminData(); // Refresh list
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create user.' });
      }
    });
  }
  // Edit the Admin User data
  saveAdminChanges() {
    if (!this.editedRow) {
      this.messageService.add({ severity: 'warn', summary: 'No Changes', detail: 'No row has been edited.' });
      this.showSaveDialog = false;
      return;
    }    
    const row = this.editedRow;    
    const payload = {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      emailAddress: row.emailAddress,
      primaryRole: row.primaryRole,
      password: '',
      userId: this.userDetail.uid
    };
    this.adminSubscribe = this.userService.createOrUpdateUser(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'User Updated', detail: 'Changes saved.' });
        this.showSaveDialog = false;
        this.loadAdminData();
        this.editedRow = null;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error?.error?.message || 'Failed to save user changes.' });
        this.showSaveDialog = false;
        this.onCancel(); // Restore original data on error
        this.editedRow = null; // Reset edited row
      }
    });
  }

  onUserChange(user: any) {
    this.newUser = user;
    this.isAddUserFormValid = !!user && !!user.firstName && !!user.lastName && !!user.email && !!user.password && !!user.primaryRole;
  }

  getPersonalization() {
    const userId = this.userDetail?.uid || 0;
    this.personalizationService.getLatestCustomerPersonalization(this.stateKey, userId).subscribe({
      next: (res) => {
        const state = res?.result.appState ? JSON.parse(res.result.appState) : null;
        const contextData = res?.result?.contextData;
        const context = typeof contextData === 'string' ? JSON.parse(contextData) : contextData;
        // Restore context filters (selected user, etc.)
        if (context?.selectedUserId && context?.selectedUserName) {
          this.selectedRow = {
            id: context.selectedUserId,
            emailAddress: context.selectedUserName
          };
        }
        // Restore grid state
        if (state && this.gridApi) {
          if (state.columnState) {
            this.gridApi.applyColumnState({ state: state.columnState, applyOrder: true });
          }
          setTimeout(() => {
            if (state.filterModel) {
              this.gridApi.setFilterModel(state.filterModel);
            }
            if (state.sortModel && (this.gridApi as any).setSortModel) {
              (this.gridApi as any).setSortModel(state.sortModel);
            }
            this.gridApi.refreshHeader();
            this.gridApi.redrawRows();
          }, 50);
        }
        this.hasRestoredPersonalization = true; // Prevent future re-runs
      },
      error: (err) => {
        console.warn('No personalization found or failed to load.', err);
      },
    });
  }

}
