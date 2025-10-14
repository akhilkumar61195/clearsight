import { Component, ViewChild, EventEmitter, Input, Output, ElementRef, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MdlDataService } from '../../../services/mdl-data.service';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services';
import * as XLSX from 'xlsx';
import { BulkuploadService } from '../../../services/bulkupload.service';
import { TaskTypes } from '../../../common/enum/common-enum';
import { BatchFileUpload } from '../../../common/model/batch-file-upload';
import { S3BucketService } from '../../../services/document-service/s3-bucket.service';
import { MDLDrillingTemplate } from '../../../common/constant';
import { MDLCompletionTemplate } from '../../../common/constant';
import { ExcelColumnMapService } from '../../../services/excel-column-service/excel-column.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ExcelService } from '../../../services/excel-column-service/excel.service';

@Component({
  selector: 'app-mdl-file-upload',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './mdl-file-upload.component.html',
  styleUrl: './mdl-file-upload.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MdlFileUploadComponent {
  @ViewChild('fileInput') fileInput: ElementRef;
  selectedFile: File = null;
  @Input() visible: boolean = false;
  @Input() isUploadAllowed: boolean = true; // To get the user access for edit the form
  @Input() functionId: number = 1; // To get the user access for override the existing records
  @Output() onClose = new EventEmitter<void>();
  @Output() onBulkUpload = new EventEmitter<void>();
  userDetail: any;
  isFileValid: boolean = false;
  excelData: any[] = [];
  override:any;
  sheetName:string = 'MDL';
  constructor(private mdlDataService: MdlDataService, 
    private authService: AuthService, 
    private messageService: MessageService,
    private bulkuploadService: BulkuploadService,
    private s3BucketService: S3BucketService,
    private excelColumnMapService: ExcelColumnMapService,
    private excelService: ExcelService
  ) {
    this.userDetail = this.authService.getUserDetail();
    //this.sheetName = this.functionId == 1 ? 'MDL Drilling' : 'MDL Completions';
  }

  onUpload() {
    if (this.isFileValid && this.selectedFile) {
      const reader = new FileReader();

      reader.onload = async (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = this.sheetName || workbook.SheetNames[0]; // Get the sheet name
        const worksheet = workbook.Sheets[sheetName];

        // Replace headers in the worksheet
        this.replaceExcelHeaders(worksheet);

        // Convert updated worksheet back to workbook
        const updatedWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(updatedWorkbook, worksheet, sheetName);

        // Convert workbook to binary Excel format
        const updatedExcelBuffer = XLSX.write(updatedWorkbook, { bookType: 'xlsx', type: 'array' });

        // Create a new Blob with the updated file
        const updatedFile = new Blob([updatedExcelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Create a new File object
        const updatedFileName = this.selectedFile.name.replace('.xlsx', '_updated.xlsx');
        const finalFile = new File([updatedFile], updatedFileName, { type: updatedFile.type });

      // Convert to JSON
      this.excelData = XLSX.utils.sheet_to_json(worksheet);

        const request: BatchFileUpload = {
          fileName: this.selectedFile.name,
          //jsonData: JSON.stringify(this.excelData),
          userId: this.userDetail.uid,
          organizationId: this.userDetail.organizationId || 0,
          isOverride: this.override.toString(),
          // schematicId: 0, // schematicId is not used here,
          invalidThreshold: 50, // Set invalid threshold to 50
          uploadType: this.functionId == 1 ? TaskTypes.MDLDrilling : TaskTypes.MDLCompletions
        };
        this.messageService.add({ severity: 'info', summary: 'File Received', detail: 'File is sent for upload. You can view upload status by clicking on Status button.' });
        // Upload modified file
        //this.bulkuploadService.uploadMdlCompletions(request, TaskTypes.MDLCompletions)
        this.bulkuploadService.handleUpload(request, this.excelData)
        //this.mdlDataService.bulkUploadMdl(formData)
          .subscribe(response => {
            this.messageService.add({ severity: 'info', summary: 'Data Uploaded', detail: response.message });
          }, error => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: error['error'] });
          });

        // Clear file input
        this.selectedFile = null;
        this.fileInput.nativeElement.value = '';
      };

      reader.readAsArrayBuffer(this.selectedFile); // Read file
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error uploading file to server. Make sure the file is a valid XLSX file and you are using the provided template only.' });
    }
  }


  onFileSelected(event) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      this.isFileValid = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Cannot use multiple files' });
      console.error('Cannot use multiple files');
      return;
    }
    this.selectedFile = <File>event.target.files[0];
    if (this.selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      this.isFileValid = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'The file is not a valid xlsx file.' });
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const workbook: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      // Get the first sheet
      const sheetName: string = this.sheetName || workbook.SheetNames[0]; // Get the sheet name
      const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

      //Replace the headers in excel with new mapped values
      this.replaceExcelHeaders(worksheet);

      // Extract headers
      const headers = this.getExcelHeaders(worksheet);

      // Validate headers
      let isValid = this.validateHeaders(headers)
      //validate for duplicate recrd with same material number in the excel
      isValid = this.checkForDuplicateMaterialNumbers(worksheet);

      if (isValid) {
        this.isFileValid = true;
        // Proceed with processing
      } else {
        this.isFileValid = false;
        return;
      }
    };
    reader.readAsBinaryString(target.files[0]);
  }

  checkForDuplicateMaterialNumbers(worksheet: XLSX.WorkSheet): boolean {
    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const header = jsonData[0];
    const materialNumberIndex = this.functionId == 1 ? header.indexOf("MaterialId") : header.indexOf("MaterialNumber");

    if (materialNumberIndex === -1) {
      console.error("MaterialId/MaterialNumber column not found");
      return;
    }

    // Filter out rows where MaterialNumber is undefined or empty
    const filteredData = jsonData.slice(1).filter(row => row[materialNumberIndex] !== undefined && row[materialNumberIndex] !== "");

    // Extract material numbers after filtering
    const materialNumbers = filteredData.map(row => row[materialNumberIndex]);

    // Check for duplicates
    const duplicates = materialNumbers.filter((item, index) => materialNumbers.indexOf(item) !== index);

    if (duplicates.length) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'The file is not valid as it contains duplicate records.' });
      return false
    } else {
      return true;
    }
  }

  /**
   * Finds the index of the header row in the Excel worksheet.
   * @param worksheet The Excel worksheet to search.
   * @returns The index of the header row, or 0 if not found.
   */
//   private findHeaderRowIndex(worksheet: XLSX.WorkSheet): number {
//   const range = XLSX.utils.decode_range(worksheet['!ref']);

//   for (let row = range.s.r; row <= range.e.r; row++) {
//     for (let col = range.s.c; col <= range.e.c; col++) {
//       const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
//       const cell = worksheet[cellAddress];
//       if (cell && cell.v && cell.v.toString().trim() !== '') {
//         return row; // First non-empty row is header row
//       }
//     }
//   }

//   return range.s.r; // fallback: top row
// }

  /**
   * Replaces the headers in the Excel worksheet with new mapped values.
   * @param worksheet The Excel worksheet to update.
   */
  replaceExcelHeaders(worksheet: XLSX.WorkSheet) {
  const headerMapping = this.functionId == 1 ? this.excelColumnMapService.mdlDrillingKeyMap : this.excelColumnMapService.mdlCompletionsKeyMap;

  this.excelService.replaceExcelHeaders(worksheet, headerMapping, this.excelService.findHeaderRowIndex(worksheet));
  }

  /**
   * Extracts the headers from the Excel worksheet.
   * @param worksheet The Excel worksheet to extract headers from.
   * @returns An array of header strings.
   */
  getExcelHeaders(worksheet: XLSX.WorkSheet): string[] {
  // const headers: string[] = [];
  // const range = XLSX.utils.decode_range(worksheet['!ref']);
  // const headerRowIndex = this.excelService.findHeaderRowIndex(worksheet); // Find the header row index

  // for (let col = range.s.c; col <= range.e.c; col++) {
  //   const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
  //   const cell = worksheet[cellAddress];
  //   headers.push(cell ? cell.v.toString().trim() : '');
  // }
  const headers: string[] = this.excelService.getExcelHeaders(worksheet, this.excelService.findHeaderRowIndex(worksheet));
  // Trim leading blanks
  while (headers.length > 0 && headers[0] === '') {
    headers.shift();
  }

  return headers;
}

  /**
   * Validates the headers of the uploaded Excel file.
   * @param headers The headers extracted from the Excel file.
   * @returns True if the headers are valid, false otherwise.
   */
  validateHeaders(headers: string[]): boolean {
    const expectedHeaders = this.functionId == 1 ? this.excelColumnMapService.mdlDrillingHeaders : this.excelColumnMapService.mdlCompletionsHeaders;

    // if (headers.length !== expectedHeaders.length) {
    //   this.messageService.add({ severity: 'error', summary: 'Error', detail: 'The uploaded file is not valid. Make sure you are using valid template with same headers' });
    //   return false;
    // }
    // for (let i = 0; i < headers.length; i++) {
    //   if (headers[i] !== expectedHeaders[i]) {
    //     this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Column Header Not Valid - Expected: '+ expectedHeaders[i] +', Found: ' + headers[i] });
    //     return false;
    //   }
    // }

    return this.excelService.validateHeaders(headers, expectedHeaders, false);
  }

  /**
   * Downloads the MDL template
   */
  downloadTemplate() {
    let key;
    if(this.functionId == 1) {
      key = MDLDrillingTemplate;
    }
    else {
      key = MDLCompletionTemplate;
    }
    this.excelService.downloadTemplate(key);
  }
}
