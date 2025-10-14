import { Column } from 'ag-grid-community';
import { ChangeDetectorRef, Component, effect, OnInit, signal, Signal, ViewEncapsulation, WritableSignal } from '@angular/core';
import { GridApi, GridOptions } from 'ag-grid-community';
import { WellheadkitstoreService } from './builder/wellheadkitbuilder.service';
import { WellheadKitComponents, WellheadKits } from '../../../common/model/wellhead-kits';
import { AuthService } from '../../../services/auth.service';
import { ThorDrillingMaterials } from '../../../common/model/thor-drilling-materials';
import { CommonService } from '../../../services/common.service';
import { MessageService } from 'primeng/api';
import { WellHeadKit } from '../../../common/enum/common-enum';
import { getComponentKitColumnDefs, getKitColumnDefs } from './wellheadcolumnconfig';
import { AccessControls } from '../../../common/constant';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { CreateKitComponent } from '../../common/create-kit-dialog/create-kit.component';
import { DeleteConfirmationDialogComponent } from '../../common/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { CustomDialogComponent } from '../../common/custom-dialog/custom-dialog.component';
import { AddEquipmentDialogComponent } from '../../common/addEquipmentDialog/addEquipmentDialog.component';

@Component({
  selector: 'app-wellhead',
  standalone:true,
  imports:[...PRIME_IMPORTS, CreateKitComponent, DeleteConfirmationDialogComponent,
    CustomDialogComponent,
  AddEquipmentDialogComponent],
  templateUrl: './wellhead.component.html',
  styleUrl: './wellhead.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class WellheadComponent implements OnInit {
  // AG Grid APIs
  gridApi1!: GridApi;
  gridColumnApi1!: Column;
  gridApi2!: GridApi;
  gridColumnApi2!: Column;
  showEquipmentAddDialog: boolean = false;
  displayCreateKitDialog: boolean = false;
  // Grid options
  gridOptions: GridOptions = {
    suppressRowClickSelection: true,
    rowSelection: 'single',
    animateRows: true,
    defaultColDef: {
      resizable: true,
    }
  };

  // Grid Data & Columns
  kitColumnDefs: any[] = [];
  componentKitColumnDefs: any[] = [];
  // Row height
  rowHeight: number = 40;
  selectedKits: any[] = [];// Array to hold selected kits
  selectedComponents: any[] = [];// Array to hold selected components
  kits: WritableSignal<WellheadKits[]> = this.store.kits;
  components: WritableSignal<WellheadKitComponents[]> = this.store.components;
  componentsNew: WritableSignal<WellheadKitComponents[]> = signal<WellheadKitComponents[]>([]);
  selectedKitIds: number[] = [];
  activeKit: WellheadKits = null;
  userDetail: any;
  editingKitId = signal<string | null>(null);
  selectedRow: any; // Array to hold selected row data
  selectedComponentRow: any;
  displayDeleteKitDialog: boolean = false;
  deletePopupContent: string = '';
  deleteTitle: string = '';
  totalComponentsCount: number = 0;
  loadComponentsData: any;
  addedComponents: WellheadKitComponents[] = [];
  pendingRow: any; // Store the row user clicked while the current one is unsaved
  visible: boolean = false;
  showSaveDialog:boolean = false;
  editedData: any[] = []; // Initialize edited rows array
  activeKitId: any;
  editable:boolean = false;
  selectedKitId: any;

  constructor(private store: WellheadkitstoreService,
    private authService: AuthService,
    private commonService: CommonService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService

  ) {
    this.userDetail = this.authService.getUserDetail();
     // ✅ Effect 1: select active kit row when signal changes
  // effect(() => {
  //   const activeKitId = this.store.activatedKitTypeId();
  //   if (activeKitId && this.gridApi1) {
  //     this.gridApi1.forEachNode((node) => {
  //       if (node.data?.id === activeKitId) {
  //         node.setSelected(true);
  //         this.loadComponents(activeKitId);
  //       }
  //     });
  //   }
  // });

  // ✅ Effect 2: activate first kit once kits are loaded
 effect(() => {
  const kits = this.kits();
  if (kits.length > 0) {
    if (!this.store.activatedKitTypeId()) {
      this.store.activatedKitTypeId.set(kits[0].id); // safe now
    }
  }
}, { allowSignalWrites: true });
  }

  // Initializes component by setting up grid columns and loading kits and components.
  ngOnInit() {
    this.getUserDetails();
    this.kitColumnDefs = getKitColumnDefs(this.addComponent.bind(this),this.authService);
    this.componentKitColumnDefs = getComponentKitColumnDefs(this.setEditedData.bind(this),this.authService);
    this.loadKits();
    // this.loadComponents(-1);
  }

  /**
   *  it will get the user details from jwt token
   */
     getUserDetails(){
       let userAccess = this.authService.isAuthorized(AccessControls.WELLHEAD_KIT);
       this.commonService.setuserAccess(userAccess);
       this.editable = this.authService.isFieldEditable('kitType');
    }
    
  // Sets the edited data for a row, marking it as updated and adding it to the editedData array.
  setEditedData(rowData: any) {
    rowData.isUpdated = true;
    const existingIndex = this.editedData.findIndex(r => r.id === rowData.id);
    if (existingIndex === -1) {
      this.editedData.push(rowData);
    } else {
      this.editedData[existingIndex] = rowData;
    }
  }
  
  // Loads kits from the store
  loadKits() {
    this.store.loadKits();
  }

  // Loads components of a specific kit type from the store
  loadComponents(kitTypeId: number) {
    this.store.loadComponents(kitTypeId);
    this.totalComponentsCount = this.store.getComponentsCount();
    // console.log('Total components count:', this.totalComponentsCount);
  }

  // Retrieves the total number of components from the store.
  getTotalNoOfComponents() {
    this.store.getComponentsCount();
  }

  // on row clicked event handler //
  onRowClicked(event: any) {
    this.selectedKitId = event.data.id; // Use unique field
    const clickedRow = event.data;  
    // If there's already a selected row with unsaved changes
    if (this.editedData.length > 0) {
      this.pendingRow = event; // Save clicked row to use later
      this.visible = true;     // Show confirmation dialog
      return;
    }
  
    // Safe to switch
    this.selectRow(event);
  }

  selectRow(event: any) {
    const rowNode = event.node;
    this.selectedRow = event.data;
    rowNode.setSelected(true); // highlights the row if not already selected
    // console.log('Row clicked:', event.data);
    this.loadComponents(this.selectedRow?.id);
  }

  // Handles component row selection and stores the selected rows for further actions.
  onRowClickedComponents() {
    const selectedRows = this.gridApi2.getSelectedRows();
    this.selectedComponentRow = selectedRows;
    // console.log('Row clicked:', this.selectedComponentRow.length);
  }

  // onGridReady1() method is called when the grid is ready to be used. It sets the grid API and column API for the first grid and sizes the columns to fit the grid width. //
  onGridReady1(params: any) {
    this.gridApi1 = params.api;
    this.gridColumnApi1 = params.columnApi;
    params.api.sizeColumnsToFit();
    setTimeout(() => this.setFirstRowActive(), 500)
  }

  // onGridReady2() method is called when the grid is ready to be used. It sets the grid API and column API for the first grid and sizes the columns to fit the grid width. //
  onGridReady2(params: any) {
    this.gridApi2 = params.api;
    this.gridColumnApi2 = params.columnApi;
    params.api.sizeColumnsToFit();
  }

  // Opens the equipment add dialog with the provided row data.
  openDialog(rowData: any) {
    this.showEquipmentAddDialog = true; // Open the dialog
  }

  // Create Kit Dialog method
  createWellHead() {
    // console.log('Creating Wellhead...');
     if (this.editedData.length > 0) {
      this.pendingRow = event; // Save clicked row to use later
      this.visible = true;     // Show confirmation dialog
      return;
    } else {
    this.displayCreateKitDialog = true; // Open the create kit dialog
    }
  }

  // Adding a component by opening the dialog with provided row data.
  addComponent(rowData: any) {
    // console.log('Adding component...', rowData);
    this.openDialog(rowData);
  }

  onCloseAddEquipment(){
    this.showEquipmentAddDialog = false;
  }
  // Opens a confirmation dialog for deleting either a kit or its components based on the entity type.
  openDeleteDialog(entityType: string) {   

    if (entityType === WellHeadKit.Kits&& this.selectedRow) {
      const kitType = this.selectedRow.kitType;
      const noofcomponent = this.totalComponentsCount;
      this.displayDeleteKitDialog = true; // Open the delete dialog
      this.deletePopupContent = `<b> ${kitType} </b> has <b> ${this.store.components().length}</b> no of components. Do you still want to delete it?`;
      this.deleteTitle = WellHeadKit.deleteKit;

    } else {
      const kitType = this.selectedRow.kitType;
      this.displayDeleteKitDialog = true; // Open the delete dialog
      this.deletePopupContent = `Are you sure you want to delete <b> ${this.selectedComponentRow.length} </b> selected components in <b> ${kitType} </b>`;
      this.deleteTitle = WellHeadKit.deleteComponents;
    }
  }

  // Triggers deletion of selected components or kits based on the current selection.
  onDelete() {
    if (this.selectedComponentRow?.length > 0) {
      this.deleteSelectedComponents();
    } else if (this.selectedRow) {
      this.deleteSelectedKits();
    }

  }

  // Performs a soft delete on the selected kit.
  deleteSelectedKits() {
    const userId = this.userDetail.uid;
    if (this.selectedRow) {
      this.store.softDeleteKits([this.selectedRow.id], userId);
      this.displayDeleteKitDialog = false
      // Call your delete API or method here
    }
  }

  // Soft deletes the selected components.
  deleteSelectedComponents() {
    const userId = this.userDetail.uid;

    if (this.selectedComponentRow && this.selectedComponentRow.length > 0) {

      const backendIdsToDelete = this.selectedComponentRow
        .filter(component => component.id > 0)
        .map(component => component.id);

      const localIdsToDelete = this.selectedComponentRow
        .filter(component => component.id === 0 && component.uniqueIdentifier)
        .map(component => component.uniqueIdentifier);

      // Step 1: Remove local records from addedComponents
      this.addedComponents = this.addedComponents.filter(
        component => !localIdsToDelete.includes(component.uniqueIdentifier)
      );
      const currentComponents = this.components();
      const updatedComponents = currentComponents.filter(component => {
        if (component.id > 0) {
          return !backendIdsToDelete.includes(component.id);
        }
        return !localIdsToDelete.includes(component.uniqueIdentifier);
      });

      this.components.set(updatedComponents);

      if (backendIdsToDelete.length > 0) {
        this.store.softDeleteComponents(backendIdsToDelete, userId);
      }
        // ✅ Set active kit ID again after deletion
    if (this.selectedRow) {
      this.store.activatedKitTypeId.set(this.selectedRow.id);  // or .kitTypeId if that's how your row is structured
    }
      this.selectedComponentRow = [];
      this.displayDeleteKitDialog = false;
      this.cdr.detectChanges();
      // if (this.selectedKitId && this.gridApi1) {
      //   const row = this.gridApi1.getRowNode(this.selectedKitId);
      //   if (row) {
      //     row.setSelected(true);
      //     this.loadComponents(this.selectedKitId);
      //   }
      // }
    }
  }

  // Map selected ThorDrillingMaterials to WellheadKitComponents and update the state

  onMaterialsSelectedFromPopup(selectedComponents: ThorDrillingMaterials[]) {
    const newComponents = this.store.mapToWellheadKitComponents(
      selectedComponents,
      this.selectedRow.id,
      this.selectedRow.kitType,
      this.userDetail.uid
    );

    // validate duplicates with store data + local added
    const existingComponents = this.components();  // store data
    const allComponents = [...existingComponents, ...this.addedComponents];

    const isDuplicate = this.store.validateComponents(newComponents, allComponents);
    if (isDuplicate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Duplicate Materials',
        detail: 'Some of the selected materials already exist in the kit',
        life: 3000,
      });
      return;
    }

    // Append new components to local addedComponents
    this.addedComponents = [...this.addedComponents, ...newComponents];

    // Set combined list to the signal for UI display
    this.components.set([...existingComponents, ...this.addedComponents]);

    this.showEquipmentAddDialog = false;
    this.cdr.detectChanges();
  }
//  open save prompt dialog
  
opensaveDialog(){
    this.showSaveDialog = true;
  }
  // Prepares and upserts the selected wellhead kit and its components with the current user's ID.
  saveWellHeadKit() {
    const componentList = this.components();
    const userId = this.userDetail.uid;

    // Filter for components that are newly added (id === 0) or were updated (isUpdated === true)
    const componentsToUpsert = componentList
      .filter(component => component.id === 0 || component.isUpdated)
      .map(component => ({
        ...component,
        userId,
      }));

    if (componentsToUpsert.length > 0) {
      this.store.upsertComponents(componentsToUpsert);
      this.editedData = [];
    }
    // // Prepare data for upserting kits
    if (this.selectedRow) {
      const kitsToUpsert = [
        {
          ...this.selectedRow,
          userId: userId, // Add userId to the kit
        },
      ];

      this.store.upsertKits(kitsToUpsert);
      // this.store.activatedKitTypeId.set(null);

    // // ✅ Set active kit ID again after saving
    // if (this.selectedRow) {
    //   this.store.activatedKitTypeId.set(this.selectedRow.id); 
    // }
      // Ensure activatedKitTypeId is set to selectedKitId after save
      this.store.activatedKitTypeId.set(this.selectedKitId);
      this.closeSaveDialog();
      this.selectedComponentRow = [];
      this.editedData = [];
      // window.location.reload();

      // this.loadKits();
      // this.loadComponents(this.selectedRow.id);
    }
    // // After refreshing kits data
    // setTimeout(() => {
    //   if (this.selectedKitId && this.gridApi1) {
    //     const row = this.gridApi1.getRowNode(this.selectedKitId);
    //     if (row) {
    //       row.setSelected(true);
    //       this.loadComponents(this.selectedKitId);
    //     }
    //   }
    // }, 0);
  }

  setFirstRowActive() {
  if (!this.gridApi1 || this.gridApi1.getDisplayedRowCount() === 0) return;

  // If a kit is already selected, reselect it
  if (this.selectedRow?.id) {
    const selectedNode = this.gridApi1.getRowNode(String(this.selectedRow.id));
    if (selectedNode) {
      selectedNode.setSelected(true);
      this.loadComponents(this.selectedRow.id);
      return;
    }
  }

  // Fallback to first row if no selection or not found
  const firstRowNode = this.gridApi1.getDisplayedRowAtIndex(0);
  if (firstRowNode) {
    firstRowNode.setSelected(true);
    this.loadComponents(firstRowNode.data.id);
  }
}

  onContinue() {
    this.visible = false;
  
    if (this.pendingRow) {
      this.editedData = []; // reset isUpdated before switching
      this.selectRow(this.pendingRow);
      this.pendingRow = null;
    }
  }
  closeDialog() {
    this.visible = false;
  
    if (this.editedData) {
      this.editedData = []; // discard unsaved changes
    }
  
    this.pendingRow = null; // discard pending selection
  }

  closeSaveDialog(){
    this.showSaveDialog = false;
  }

  getKitRowId(params) {
    return params.data.id; // Use your unique field
  }
}
