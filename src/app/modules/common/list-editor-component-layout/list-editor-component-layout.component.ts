import { Component, Input, OnChanges, OnInit, SimpleChanges, WritableSignal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AccessControls } from '../../../common/constant';
import { ConfigurationValues, listBuilder } from '../../../common/model/configuration-values';
import { AuthService } from '../../../services';
import { CommonService } from '../../../services/common.service';
import { ListEditorBuilderService } from '../builders/list-editor-builder.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { GridApi } from 'ag-grid-community';

@Component({
  selector: 'app-list-editor-component-layout',
  standalone: true,
  imports: [...PRIME_IMPORTS,DeleteConfirmationDialogComponent],
  templateUrl: './list-editor-component-layout.component.html',
  styleUrl: './list-editor-component-layout.component.scss'
})
export class ListEditorComponentLayoutComponent implements OnInit, OnChanges {

  /** Flag to control visibility of the list editor dialog */
  @Input() listEditorData: listBuilder[]; // Adding the variable as an input var as the app selection happening in parent component
  addRecord: ConfigurationValues;
  userDetail: any;
  displayDeleteComponentDialog: boolean = false; // Flag to control delete component dialog visibility
  displayAddComponentDialog: boolean = false; // Flag to control add component dialog visibility
  selectedDataName: string = ''; // Name of the item to be deleted
  selectedRow: Array<number> = []; // Array to hold selected row IDs
  selectedSection: any;
  isEditAllowed: boolean = false; // Checking the editability based on user access
  isDeleteAllowed: boolean = false; // Checking the editability based on user access
  currentSection: any;
  private sectionApiMap: Map<string, GridApi> = new Map(); // Using map to store the grid api
   
  storeSelectedAppId: WritableSignal<number> = this.editorBuilderService.selectedApplicationId;
  constructor(
    private editorBuilderService: ListEditorBuilderService,
    private authService: AuthService,
    private messageService: MessageService,
    private commonService: CommonService
  ) {
    this.userDetail = this.authService.getUserDetail();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listEditorData']) {
      this.listEditorData = changes['listEditorData'].currentValue;
    }
  }

  // Initialize component by getting user details

  ngOnInit(): void {
    this.editorBuilderService.selectedBuId.set(1); // Setting default BU id
    this.getUserDetails();
  }
  // Handles the grid initialization for Component Type data

  onGridReadyComponentType(params, section) {
    params.api.sizeColumnsToFit(); // Adjusts columns to fit the grid width// Calls a method to perform some action using the grid API and a string identifier "componentType"
    section['agApi'] = params.api; // Store the grid API in the section object
    this.sectionApiMap.set(section.id, params.api); // Setting the grid api when its ready
  }

      /**
     *  it will get the user details from jwt token
     */
   getUserDetails() {
    let drillingAccess =  this.authService.isAuthorized(
      AccessControls.ADMIN_DRILLING_ACCESS
    );
    let completionsAccess =  this.authService.isAuthorized(
      AccessControls.ADMIN_COMPLETION_ACCESS
    );
    this.commonService.setuserAccess(drillingAccess);
    this.commonService.setuserAccess(completionsAccess);
    this.isEditAllowed = this.authService.isFieldEditable('isAdminAddListEditor');
    this.isDeleteAllowed = this.authService.isFieldEditable(
      'isAdminDeleteListEditor'
    );
  }

  /** Editing field change */
  onComponentTypeCellValueChanged(params: any) {
    if (params.newValue !== params.oldValue) {
      let addRecord = {} as ConfigurationValues;
      addRecord.configName = params?.data?.configName; // Set the config name from the data
      addRecord.value = params.newValue; // Set the new value from the cell change
      addRecord.id = params.data.id; // Set the record ID from the data
      addRecord.userIdModifiedBy = this.userDetail.uid;
      addRecord.userIdCreatedBy = ''; // Set the user ID for the update
      addRecord.buId = this.editorBuilderService.selectedBuId(); // Added Buid
      this.updateRecords(addRecord, true);
    }
  }

  // Add new record  */
  addNewRecord() {
    this.displayAddComponentDialog = false;
    if (this.currentSection.searchText && this.currentSection.searchText.trim() !== '') {
      const exist = this.checkValueExistsInGridData(this.currentSection, this.currentSection.searchText);
      if (!exist) {
        let addRecord = {} as ConfigurationValues;
        addRecord.id = 0;
        addRecord.configName = this.currentSection.configName;
        addRecord.value = this.currentSection.searchText;
        addRecord.userIdCreatedBy = this.userDetail.uid;
        addRecord.buId = this.editorBuilderService.selectedBuId(); // Added Buid
        this.editorBuilderService.addRecord(addRecord, this.currentSection);
        this.currentSection['searchText'] = ''; // Clear the search text for the new record
      }
    }
  }

  // Updates an existing records */
  updateRecords(table: ConfigurationValues, editRecord: boolean = false) {
    let addRecord = {} as ConfigurationValues;
    if (!editRecord) {
      this.addRecord.id = table.id;
      addRecord.configName = table.configName;
      addRecord.value = table['searchText'];
      addRecord.buId = this.editorBuilderService.selectedBuId(); // Added Buid
      addRecord.userIdCreatedBy = this.userDetail.uid;
    }
    this.editorBuilderService.updates(
      !editRecord ? this.addRecord : table,
      table
    );
  }
  //Deletes selected rows from the grid */
  sendSelectedRows(section: any) {
    // Adding check for grid api
    const api = this.sectionApiMap.get(section.id);
    if (api) {
          let selectedRows = api?.getSelectedRows().map((row) => row.id);
    this.selectedDataName = api
      .getSelectedRows()
      .map((row) => row.value)
      .join(', ');
    this.displayDeleteComponentDialog = true;
    this.selectedRow = selectedRows;
    this.selectedSection = section;
    }

  }
  //Adds selected row from the grid */
  openAddSelectionPopUp(section: any) {
    this.currentSection = section;
    this.selectedDataName = this.currentSection['searchText']
    this.displayAddComponentDialog = true;
  }

  deleteAssemblyDialog() {
    this.displayDeleteComponentDialog = false;
    this.editorBuilderService.deleteRecords(
      this.selectedRow,
      this.userDetail.uid,
      this.selectedSection
    );
    this.selectedRow = []; // Clear the selected rows after deletion
    this.selectedSection = null; // Clear the selected section after deletion
    this.selectedDataName = ''; // Clear the item name after deletion
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: ' Record Deleted Successfully',
    });
  }

  checkValueExistsInGridData(section: any, searchText: string): boolean {
    let isExist = false;
    if (section?.agApi) {
          section?.agApi?.forEachNode((node) => {
      const rowData = node.data;
      if (rowData['value'])
        if (
          rowData['value'] != null &&
          rowData['value'].toString().toLowerCase() === searchText.toLowerCase()
        ) {
          isExist = true;
        }
    });
    isExist &&
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Record Already Exists',
      });
    }
    return isExist;
  }
}

