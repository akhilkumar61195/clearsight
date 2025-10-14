import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';
import { BatchFileUpload } from '../../../../common/model/batch-file-upload';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonService } from '../../../../services/common.service';
import { AuthService } from '../../../../services';
import { BulkuploadService } from '../../../../services/bulkupload.service';
import { TaskTypes } from '../../../../common/enum/common-enum';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';

@Component({
  selector: 'app-control-line-and-clamp-dialog',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './control-line-and-clamp-dialog.component.html',
  styleUrl: './control-line-and-clamp-dialog.component.scss'
})
export class ControlLineAndClampDialogComponent {
  @Output() onClose = new EventEmitter<void>();
  @Output() fileUploaded = new EventEmitter<void>();
  @Input() displayControlLineAndClampDialog: boolean = false;
  @Input() schematicId: number;
  isFileValid: boolean = false;
  selectedFile: File = null;
  excelData: any[] = [];
  userDetail: any;
  loading: boolean = false;
  validationErrors: string[] = [];  // To hold the validation error messages
  // @Input()statusId! :number;

  constructor(
    private messageService: MessageService,
    private api: BulkuploadService,
    private authService: AuthService,
    private commonService: CommonService,
    private spinner: NgxSpinnerService) {
      this.userDetail = this.authService.getUserDetail();
  }

  ngOnInit(): void {
  }
/**
 * Handles the file selection event.
 * Validates the selected file type, checks for required sheets and headers, 
 * and parses the file content into JSON format for further processing.
 * Displays appropriate error messages for invalid files or data.
 * 
 * @param event The file input change event triggered when a file is selected.
 */
  onFileSelected(event) {

    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      this.isFileValid = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Cannot use multiple files' });
      console.error('Cannot use multiple files');
      return;
    }
    this.selectedFile = <File>target.files[0];
    if (this.selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      this.isFileValid = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'The file is not a valid xlsx file.' });
      console.error('The file is not a valid xlsx file.');
      return;
    }
    // if((target.files[0].name !=='DepthTable.xlsx') &&(target.files[0].name!=='Depth Table.xlsx') ){
    //   this.isFileValid = false;
    //   this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid File/ "DepthTable" sheet is not found' });
    //   return;
    // }
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const workbook: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      // const sheetName: string = workbook.SheetNames[0];
      const sheetNames = workbook.SheetNames;
      const sheetName = sheetNames.find(sheet => sheet.toLowerCase() === 'clamptemplate' || sheet.toLowerCase() === 'clamp template');

      if (!sheetName) {
        this.isFileValid = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'The "ClampTemplate" sheet is not found in the file.' });
        console.error('The "ClampTemplate" sheet is not found in the file.');
        return;
      }
      const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
      const headers = this.getExcelHeaders(worksheet);
      if (!this.validateHeaders(headers)) {
        this.isFileValid = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid headers in the file.' });
        console.error('Invalid headers in the file.');
        return;
      }
      this.excelData = XLSX.utils.sheet_to_json(worksheet);

      this.addDefaultFieldsToData();
      this.validateData();

      if (this.validationErrors.length > 0) {
        this.isFileValid = false;
        const combinedErrorMessage = this.validationErrors.join('<br/>');
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Errors',
          detail: combinedErrorMessage,
          life: 10000, // Optional: increase popup display time
        });
        console.error('Validation errors:', this.validationErrors);
      } else {
        this.isFileValid = true;
        // console.log('File is valid and ready for processing.');
        this.mapDataToDatabaseColumns();
      }
    };
    reader.readAsBinaryString(target.files[0]);
  }

  getExcelHeaders(worksheet: XLSX.WorkSheet): string[] {
    const headers: string[] = [];
    const range = XLSX.utils.decode_range(worksheet['!ref']);

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      const cell = worksheet[cellAddress];
      headers.push(cell ? cell.v : '');
    }
    return headers;
  }

  validateHeaders(headers: string[]): boolean {
    const expectedHeaders = [
      "Manufacturer Part #", "Halliburton Part #", "Min Quantity (Primary)", "Total Quantity Provided"
    ];

    if (headers.length !== expectedHeaders.length) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'The file is not a valid. Make sure you are using valid template' });
      return false;
    }
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'The file is not a valid. Make sure you are using valid template' });
        return false;
      }
    }
    return true;
  }

  downloadTemplate() {
    // this.mdlDataService.downloadMdlTemplate().subscribe((response: any) => {
    //   const blob = new Blob([response], { type: response.type });
    //   const downloadURL = window.URL.createObjectURL(blob);
    //   const link = document.createElement('a');
    //   link.href = downloadURL;
    //   link.download = 'MDLTemplate.xlsx';
    //   link.click();
    // });
  }

  addDefaultFieldsToData() {
    // Add additional fields to each row in the excel data
    this.excelData = this.excelData.map(row => ({
      ...row,
      schematicsID: this.schematicId,
      uid: this.userDetail.uid
    }));
  }

  mapDataToDatabaseColumns() {
    // Define the mapping from Excel column names to database column names
    const columnMapping = {
      "Manufacturer Part #": "ManufacturerPart",
      "Halliburton Part #": "HalliburtonPart",
      "Min Quantity (Primary)": "PrimaryDemand",
      "Total Quantity Provided": "TotalQty"
    };

    // Map each row to the database columns
    this.excelData = this.excelData.map(row => {
      const mappedRow: any = {};

      // For each column in the row, use the mapping to get the corresponding database column
      Object.keys(row).forEach(excelColumn => {
        const dbColumn = columnMapping[excelColumn] || excelColumn; // Default to the original column name if no mapping exists
        mappedRow[dbColumn] = row[excelColumn];
      });

      return mappedRow;
    });
  }
/**
 * Validates the parsed Excel data to ensure it meets the required criteria.
 * Performs checks for empty data, missing or invalid fields, duplicate entries, 
 * and ensures numeric values for specific columns.
 * Populates the `validationErrors` array with error messages for any validation failures.
 */
  validateData() {
    this.validationErrors = [];

    // Validation 0: Check if the file data is empty
    if (!this.excelData || this.excelData.length === 0) {
      this.validationErrors.push("The uploaded file is empty. Please upload a valid file with data.");
      // this.onClose.emit();
      this.isFileValid = false;
      return;
    }

    const manufacturerPartSet = new Set();

    this.excelData.forEach((row, rowIndex) => {
      const manufacturerPart = row['Manufacturer Part #'];
      const minQty = row['Min Quantity (Primary)'];
      const totalQty = row['Total Quantity Provided'];

      // Validation 1: Manufacturer Part # cannot be empty
      if (!manufacturerPart || manufacturerPart.toString().trim() === '') {
        this.validationErrors.push(`Row ${rowIndex + 1}: 'Manufacturer Part #' cannot be empty.`);
      }

      // Validation 2: No duplicates in Manufacturer Part #
      if (manufacturerPart) {
        if (manufacturerPartSet.has(manufacturerPart)) {
          this.validationErrors.push(`Duplicate Manufacturer Part # found at Row ${rowIndex + 1}: '${manufacturerPart}'.`);
        } else {
          manufacturerPartSet.add(manufacturerPart);
        }
      }

      // Validation 3: Min Quantity (Primary) cannot be empty
      if (minQty === null || minQty === undefined || minQty === '') {
        this.validationErrors.push(`Row ${rowIndex + 1}: 'Min Quantity (Primary)' cannot be empty.`);
      }

      // Validation 4: Total Quantity Provided cannot be empty
      if (totalQty === null || totalQty === undefined || totalQty === '') {
        this.validationErrors.push(`Row ${rowIndex + 1}: 'Total Quantity Provided' cannot be empty.`);
      }

      // Validation 5: Ensure numeric values for quantity fields
      ['Min Quantity (Primary)', 'Total Quantity Provided'].forEach((column) => {
        if (typeof row[column] !== 'number' || isNaN(row[column])) {
          this.validationErrors.push(`Row ${rowIndex + 1}, Column '${column}': Value '${row[column]}' is not a valid numeric value.`);
        }
      });
    });

    if (this.validationErrors.length > 0) {
      // this.onClose.emit();
      this.isFileValid = false;
    }
  }

  closeControlClamp() {
    this.onClose.emit();
  }

  onUpload() {
    if (this.isFileValid) {
      const request: BatchFileUpload = {
        file: this.selectedFile,
        jsonData: JSON.stringify(this.excelData),
        userId: this.userDetail.uid
      };

      this.spinner.show();
      this.api.uploadFile(request, TaskTypes.CONTROLLINECLAMPS).subscribe({
        next: (res) => {
          this.spinner.hide();
          this.messageService.add({ severity: 'success', summary: 'Success', detail: res.details });
          
          this.fileUploaded.emit();
          this.onClose.emit();
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error });
          this.onClose.emit();
          this.spinner.hide();

        }
      })


    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: "File is not valid." });
    }
  }
}
