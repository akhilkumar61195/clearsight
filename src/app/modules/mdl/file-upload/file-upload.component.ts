import { Component, ViewChild, EventEmitter, Input, Output, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MdlDataService } from '../../../services/mdl-data.service';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services';
import * as XLSX from 'xlsx';
import { BulkuploadService } from '../../../services/bulkupload.service';
import { TaskTypes } from '../../../common/enum/common-enum';
import { BatchFileUpload } from '../../../common/model/batch-file-upload';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ExcelService } from '../../../services/excel-column-service/excel.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
  @ViewChild('fileInput') fileInput: ElementRef;
  selectedFile: File = null;
  @Input() visible: boolean = false;
  @Input() isUploadAllowed: boolean = true; // To get the user access for edit the form
  @Output() onClose = new EventEmitter<void>();
  @Output() onBulkUpload = new EventEmitter<void>();
  userDetail: any;
  isFileValid: boolean = false;
  excelData: any[] = [];
  override:any;
  constructor(private mdlDataService: MdlDataService, private authService: AuthService, private messageService: MessageService,private bulkuploadService: BulkuploadService, private excelService: ExcelService) {
    this.userDetail = this.authService.getUserDetail();
  }

  onUpload() {
    if (this.isFileValid && this.selectedFile) {
      const reader = new FileReader();

      reader.onload = async (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
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
          uploadType: TaskTypes.MDLCompletions
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
      const sheetName: string = workbook.SheetNames[0];
      const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

      //Replace the headers in excel with new mapped values
      this.replaceExcelHeaders(worksheet);

      // Extract headers
      const headers = this.getExcelHeaders(worksheet);

      // Validate headers
      let isValid = this.validateHeaders(headers);
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
    const materialNumberIndex = header.indexOf("MaterialNumber");

    if (materialNumberIndex === -1) {
      console.error("MaterialNumber column not found");
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

  replaceExcelHeaders(worksheet: XLSX.WorkSheet) {
    const headerMapping = {
      "MM# / MMR#": "MaterialNumber",
      "Is this Supplier Specific? 0 = No 1 = Yes": "IsSupplierSpecificFlag",
      "Supplier": "SupplierId",
      "Component Type": "ComponentTypeId",
      "Material Grade": "MaterialGradeId1",
      "Material Grade - Secondary": "MaterialGradeId2",
      "Material Grade - Tertiary": "MaterialGradeId3",
      "Range": "RangeId",
      "Top Connection": "TopendConnectionId",
      "Middle Connection": "MiddleendConnectionId",
      "Bottom Connection": "BottomendConnectionId",
      "Connection Configuration": "ConnectionConfigId",
      "Description": "MaterialDescription",
      "Trade Name": "TradeName",
      "Supplier Part #": "SupplierPartNumber",
      "Legacy Ref #": "LegacyRefNumber",
      "Nominal/Max OD (IN)": "NominalOd1",
      "Nominal/Max OD (IN) - Secondary": "NominalOd2",
      "Nominal OD/Max (IN) - Tertiary": "NominalOd3",
      "Wall Thickness (IN)": "WallThickness",
      "Min Yield Strength (PSI)": "YeildStrength",
      "Drift": "Drift",
      "Weight (LB)": "Weight1",
      "Weight (LB) - Secondary": "Weight2",
      "Weight (LB) - Tertiary": "Weight3",
      "Actual OD (IN)": "ActualOd1",
      "Actual OD (IN) - Secondary": "ActualOd2",
      "Actual OD (IN) - Tertiary": "ActualOd3",
      "Max Temperature Rating (F)": "MaxTempRating",
      "Actual ID (IN)": "ActualId1",
      "Actual ID (IN) - Secondary": "ActualId2",
      "Actual ID (IN) - Tertiary": "ActualId3",
      "Quality Plan Designation": "QualityPlanDesignation",
      "Min Temperature Rating (F) - Elastomers": "ElastomersMinTempRating",
      "Max Temperature Rating (F) - Elastomers": "ElastomersMaxTempRating",
      "Elastomer Notes": "ElastomerNotes",
      "Standard Notes": "StandardNotes",
      "Max Pressure Rating (PSI)": "MaxPressureRating",
      "Differential Pressure Rating (PSI)": "DiffPressureRating",
      "Burst Pressure (PSI)": "BurstPressure",
      "Collapse Pressure (PSI)": "CollapsePressure",
      "Manufacturer": "ManufacturerId",
      "Threaded Connection? 0 = No 1 = Yes": "IsThreadedConnection",
      "Contains Elastomer Elements? 0 = No 1 = Yes": "IsContainsElastomerElements",
      "Connection Burst Pressure": "ConnectionBurstPressure",
      "Connection Collapse Pressure": "ConnectionCollapsePressure",
      "Connection Yield Strength": "ConnectionYeildStrength",
      "Makeup Loss": "MakeupLoss",
      "Elastomer Type": "elastomerTypeID",
      "Group": "groupName",
      "Project Tag": "projectTags",
      "Administrative Notes":"AdministrativeNotes",
      "Material Group": "MaterialGroup",
      "Axial Strength (PSI)": "AxialStrength",
      "Connection Type": "ConnectionType",
      "Vendor SAP #": "VendorSAPNumber",
      "Unit of Measure": "UoM",
    };

    this.excelService.replaceExcelHeaders(worksheet, headerMapping, 0);
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
    //const expectedHeaders = [
    //  "MaterialNumber", "IsSupplierSpecificFlag", "SupplierId", "ComponentTypeId",
    //  "MaterialGradeId1", "MaterialGradeId2", "MaterialGradeId3", "RangeId",
    //  "TopendConnectionId", "MiddleendConnectionId", "BottomendConnectionId",
    //  "ConnectionConfigId", "MaterialDescription", "TradeName", "SupplierPartNumber",
    //  "LegacyRefNumber", "NominalOd1", "NominalOd2", "NominalOd3", "WallThickness",
    //  "YeildStrength", "Drift", "Weight1", "Weight2", "Weight3", "ActualOd1",
    //  "ActualOd2", "ActualOd3", "MaxTempRating", "ActualId1", "ActualId2", "ActualId3",
    //  "QualityPlanDesignation", "ElastomersMinTempRating", "ElastomersMaxTempRating",
    //  "ElastomerNotes", "StandardNotes", "MaxPressureRating", "DiffPressureRating",
    //  "BurstPressure", "CollapsePressure", "ManufacturerId", "IsThreadedConnection",
    //  "IsContainsElastomerElements", "ConnectionBurstPressure", "ConnectionCollapsePressure",
    //  "ConnectionYeildStrength", "MakeupLoss", "elastomerTypeID"
    //];
    const expectedHeaders = [
      "ComponentTypeId",
      "groupName",
      "MaterialGroup",
      "projectTags",
      "TradeName",
      "MaterialNumber",
      "VendorSAPNumber",
      "UoM",
      "SupplierPartNumber",
      "LegacyRefNumber",
      "NominalOd1",
      "NominalOd2",
      "NominalOd3",
      "ActualOd1",
      "ActualOd2",
      "ActualOd3",
      "ActualId1",
      "ActualId2",
      "ActualId3",
      "Weight1",
      "Weight2",
      "Weight3",
      "WallThickness",
      "MaterialGradeId1",
      "MaterialGradeId2",
      "MaterialGradeId3",
      "YeildStrength",
      "TopendConnectionId",
      "MiddleendConnectionId",
      "BottomendConnectionId",
      "ConnectionConfigId",
      "ConnectionType",
      "RangeId",
      "ElastomersMinTempRating",
      "ElastomersMaxTempRating",
      "MaxPressureRating",
      "AxialStrength",
      "MaxTempRating",
      "DiffPressureRating",
      "BurstPressure",
      "CollapsePressure",
      "QualityPlanDesignation",
      "ElastomerNotes",
      "StandardNotes",
      "AdministrativeNotes",
      "SupplierId",
      "MaterialDescription",
      "Drift",
      "ManufacturerId",
      "IsThreadedConnection",
      "IsContainsElastomerElements",
      "ConnectionBurstPressure",
      "ConnectionCollapsePressure",
      "ConnectionYeildStrength",
      "MakeupLoss",
      "RBW",
      "elastomerTypeID"
    ];

    if (headers.length !== expectedHeaders.length) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'The uploaded file is not valid. Make sure you are using valid template with same headers' });
      return false;
    }
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Column Header Not Valid - Expected: '+ expectedHeaders[i] +', Found: ' + headers[i] });
        return false;
      }
    }
    return true;
  }

  downloadTemplate() {
    this.mdlDataService.downloadMdlTemplate().subscribe((response: any) => {
      const blob = new Blob([response], { type: response.type });
      const downloadURL = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = 'MDLTemplate.xlsx';
      link.click();
    });
  }
}
