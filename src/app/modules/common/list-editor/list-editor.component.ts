import { Component, effect, Input, OnDestroy, signal, WritableSignal } from '@angular/core';
import { ListEditorBuilderService } from '../builders/list-editor-builder.service';
import { ConfigurationValues, listBuilder } from '../../../common/model/configuration-values';
import { AuthService } from '../../../services';
import { MessageService } from 'primeng/api';
import { AccessControls } from '../../../common/constant';
import { CommonService } from '../../../services/common.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';

@Component({
  selector: 'app-list-editor',
  standalone: true,
  imports: [...PRIME_IMPORTS,DeleteConfirmationDialogComponent],
  templateUrl: './list-editor.component.html',
  styleUrl: './list-editor.component.scss',
})
export class ListEditorComponent implements OnDestroy {

  /** Flag to control visibility of the list editor dialog */
  isListEditorVisible = false;
  listEditorData: WritableSignal<listBuilder[]> = this.editorBuilderService.listEditor;
  addRecord: ConfigurationValues;
  userDetail: any;
  displayDeleteComponentDialog: boolean = false; // Flag to control delete component dialog visibility
  deleteItemDataName: string = ''; // Name of the item to be deleted
  selectedRow: Array<number> = []; // Array to hold selected row IDs
  selectedSection: any;
  isEditAllowed: boolean = false; // Checking the editability based on user access
  //dialogStyle:string = "{width: '80%'}"
  constructor(
    private editorBuilderService: ListEditorBuilderService,
    private authService: AuthService,
    private messageService: MessageService,
    private commonService: CommonService
  ) {
    this.userDetail = this.authService.getUserDetail();
    effect(() => {
      this.editorBuilderService.getConfiguartions();
    });
  }

  // Resetting the signal
  ngOnDestroy(): void {
    this.editorBuilderService.selectedFunctionId.set(-1);
  }


  // Initialize component by getting user details

  ngOnInit(): void {
    this.editorBuilderService.selectedBuId.set(1); // Setting default BU id
    // Fetch all configuration types
    this.editorBuilderService.getConfiguartions();

  }
  // Handles the grid initialization for Component Type data

  onGridReadyComponentType(params, section) {
    params.api.sizeColumnsToFit(); // Adjusts columns to fit the grid width// Calls a method to perform some action using the grid API and a string identifier "componentType"
    section['agApi'] = params.api; // Store the grid API in the section object
  }

      /**
     *  it will get the user details from jwt token
     */
   getUserDetails() {
    let userAccess =  this.authService.isAuthorized(
      AccessControls.MDL_DRILLING_ACCESS
    );
    this.commonService.setuserAccess(userAccess);
    this.isEditAllowed = this.authService.isFieldEditable(
      'IsAddDeleteListEditor'
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

  // Opens the list editor dialog
  closeDialog() {
    this.isListEditorVisible = false; // Close the list editor dialog
  }
  // sending new record  */
  addNewRecord(table: any) {
    if (table.searchText && table.searchText.trim() !== '') {
      const exist = this.checkValueExistsInGridData(table, table.searchText);
      if (!exist) {
        let addRecord = {} as ConfigurationValues;
        addRecord.id = 0;
        addRecord.configName = table.configName;
        addRecord.value = table.searchText;
        addRecord.userIdCreatedBy = this.userDetail.uid;
        addRecord.buId = this.editorBuilderService.selectedBuId(); // Added Buid
        this.editorBuilderService.addRecord(addRecord, table);
        table['searchText'] = ''; // Clear the search text for the new record
      }
    }
  }

  // Updates an existing records */
  updateRecords(table: ConfigurationValues, editRecord: boolean = false) {
    //console.log('Adding new component type', table);
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
    let selectedRows = section['agApi'].getSelectedRows().map((row) => row.id);
    this.deleteItemDataName = section['agApi']
      .getSelectedRows()
      .map((row) => row.value)
      .join(', ');
    this.displayDeleteComponentDialog = true;
    this.selectedRow = selectedRows;
    this.selectedSection = section;
    // this.deleteAssemblyDialog(selectedRows, section);
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
    this.deleteItemDataName = ''; // Clear the item name after deletion
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: ' Record Deleted Successfully',
    });
  }

  checkValueExistsInGridData(section: any, searchText: string): boolean {
    let isExist = false;
    section.agApi.forEachNode((node) => {
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
    return isExist;
  }
}
