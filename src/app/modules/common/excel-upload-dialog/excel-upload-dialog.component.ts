import { Component, ElementRef, EventEmitter, input, Input, output, Output, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';
import { BulkuploadService } from '../../../services/bulkupload.service';
import { SchematicClamps } from '../../../common/model/schematic-clamps';
import { AuthService } from '../../../services';
import { MessageService } from 'primeng/api';
import { InventoryUpload, LhAndWellHeadUpload, MitiUpload, RawDataUpload, TenarisUpload, VallourecUpload, WellHeadUpload, YardInventoryUpload } from '../../../common/model/rawDataBulkUploadModel';
import { DatePipe } from '@angular/common';
import { ClampTemplate, inventoryScreen, LhScreen, mitiScreen, tenarisScreen, vallorecScreen, wellHeadScreen, yardInventoryScreen } from '../../../common/constant';
import { S3BucketService } from '../../../services/document-service/s3-bucket.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ExcelService } from '../../../services/excel-column-service/excel.service';
@Component({
  selector: 'app-excel-upload-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './excel-upload-dialog.component.html',
})
export class ExcelUploadComponent {
  @ViewChild('fileInput') fileInput: ElementRef;
  @Input() additionalFields: { [key: string]: any } = {}; // Additional fields to add to each row
  @Input() acceptedFileTypes: string = '.xlsx, .xls, .xlsm'; // Accepted file types for upload
  @Input() validateData: (data: any[]) => string[]; // Function to validate the uploaded data
  @Input() expectedHeaders: string[] = []; // Expected headers for validation
  @Input() columnMapping: { [key: string]: string } = {}; // Mapping for Excel to database columns
  @Input() schematicId: number; // Schematic ID to send to the service
  @Input() sheetName: string = ''; // Optional: Specific sheet name to validate
  @Input() headerIndexNumber: number = 0;
  @Output() onUploadFile = new EventEmitter<{ file: File, data: any[] }>(); // Event emitted when a file is uploaded
  @Input() isDialogClose: boolean = false; // it will detect close call of app-custom dialog
  mappedClampsData: SchematicClamps[] = [];
  mappedOdinDrillingData: RawDataUpload[] = []; // raw data model intiliazation
  mappedTenarisOrderData: TenarisUpload[] = [];// Tenaris model intiliazation
  mappedVallorecOrderData: VallourecUpload[] = []; // Vallorec model intiliazation
  mappedLhandWellHeadOrderData: LhAndWellHeadUpload[] = []; // Vallorec model intiliazation
  mappedInventoryOrderData: InventoryUpload[] = []; // Inventory model intiliazation
  mappedMitiHeadOrderData: MitiUpload[] = []; // Vallorec model intiliazation
  mappedWellHeadOrderData: WellHeadUpload[] = []; // wellhead model intiliazation
  mappedYardInventoryOrderData: YardInventoryUpload[] = []; // yard invenory model intiliazation
  @Input() showDescription: boolean = false;// it will show/hide description if custom -dialog will  not use
  @Input() bulkUploadScreen: string; // it will use for to map cloumn of excel sheet according to screen
  @Input() selectedTabView: string;// it will filter the selected supplier recrod's
  @Output() onValidationErrorMessage = new EventEmitter<string>(); // Event will trigger validation console
  selectedFile: File = null;
  excelData: any[] = [];
  validationErrors: string[] = [];
  isFileValid: boolean = false;
  uploadedfileName: string = '';
  userDetail: any;
  isShowingProgressBar: boolean = false; // dyanmically changing button lable
  @Input() isBulkUploadEditable: boolean = false;



  constructor(private bulkUploadService: BulkuploadService,
    private renderer: Renderer2, private authService: AuthService,
    private messageService: MessageService, private datePipe: DatePipe,private s3BucketService: S3BucketService,
    private excelService: ExcelService
  ) {
    this.userDetail = this.authService.getUserDetail();
  }


  /**
 * Adds additional fields to each row in the parsed Excel data.
 * The additional fields are provided dynamically via the `additionalFields` input.
 */
  addDefaultFieldsToData() {
    if (this.additionalFields && Object.keys(this.additionalFields).length > 0) {
      this.excelData = this.excelData.map(row => ({
        ...row,
        ...this.additionalFields, // Dynamically add additional fields
      }));
    }
  }



  onFileClick() {

    this.renderer.selectRootElement(this.fileInput.nativeElement).click(); // Trigger the file input click

  }

  /**
   * Handles the file selection event.
   */

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.processSelectedFile(file);
  }
  // common method to process the selected file
  processSelectedFile(file: File) {
    this.isShowingProgressBar = true;
    this.uploadedfileName = file.name;
    if (!file) return;

    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!this.acceptedFileTypes.includes(fileType!)) {
      this.isFileValid = false;
      this.validationErrors = ['Unsupported file type. Please upload a valid Excel file.'];
      this.isShowingProgressBar = false;
      this.clearFileUpload();
      this.onValidationErrorMessage.emit(this.validationErrors[0]);
      console.error('Unsupported file type:', fileType);
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();

    reader.onload = (e: any) => {

      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const sheetNames = workbook.SheetNames;
      const sheetNameToUse = this.sheetName || sheetNames[0];

      if (!sheetNames.includes(sheetNameToUse)) {
        this.isFileValid = false;
        this.validationErrors = ['The file is not valid. Make sure you are using the correct template.'];
        this.isShowingProgressBar = false;
        this.onValidationErrorMessage.emit(this.validationErrors[0]);
        return;
      }

      const worksheet = workbook.Sheets[sheetNameToUse];
      const headers = this.excelService.getExcelHeaders(worksheet,this.headerIndexNumber);

      if (this.expectedHeaders.length > 0 && !this.validateHeaders(headers)) {
        
        this.isFileValid = false;
        this.isShowingProgressBar = false;
        this.clearFileUpload();
        this.onValidationErrorMessage.emit(this.validationErrors[0]);
        return;
      }

      // const rawExcelRawData = XLSX.utils.sheet_to_json(worksheet);
      const rawExcelRawData = XLSX.utils.sheet_to_json(worksheet, {
        range: this.headerIndexNumber, // same index you found earlier
        defval: '',            // fill empty cells with empty string (important!)
        blankrows: false,
      });

      const cleanedExcelRawData = this.remapExcelKeys(rawExcelRawData);
      this.excelData = cleanedExcelRawData;

      this.addDefaultFieldsToData();
      this.mapDataToDatabaseColumns();

      if (this.validateData) {
        this.validationErrors = this.validateData(this.excelData);
        this.isFileValid = this.validationErrors.length === 0;
        this.mapExcelDataByScreen();
      } else {
        this.isFileValid = true;
      }

      if (!this.isFileValid) {
        console.error('Validation Errors:', this.validationErrors);
      }

      if (this.bulkUploadScreen === 'bulkUploadSchematicClamp') {
        this.bulkUploadService.getComponentMaterials(this.mappedClampsData, this.schematicId).subscribe({
          next: (response: SchematicClamps[]) => {
            if (response && response.length > 0) {
              const detailsMessages = response.map(item => item.details).filter(detail => detail).join('\n');
              this.isFileValid = false;
              this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: `Some clamps already exist:\n${detailsMessages}`,
                life: 5000
              });
            } else {
              this.isFileValid = true;
            }
          },
          error: () => {
            this.isFileValid = false;
            this.validationErrors = ['An error occurred while validating the clamps data. Please try again.'];
            this.isShowingProgressBar = false;
          }
        });
      }

      this.isShowingProgressBar = false;
    };

    reader.readAsBinaryString(file);
  }

  mapClampsData() {
    this.mappedClampsData = this.excelData.map((row: any): SchematicClamps => ({
      id: 0,
      schematicId: this.schematicId,
      materialKey: row.materialKey || '',
      materialNumber: row.materialNumber || '',
      manufacturerPart: row.manufacturerPart.toString() || '',
      halliburtonPart: row.halliburtonPart.toString() || '',
      primaryDemand: Number(row.primaryDemand) || 0,
      totalQty: Number(row.totalQty) || 0,
      contingencyDemand: Number(row.contingencyDemand) || 0,
      userId: Number(this.userDetail?.uid) || 0,
      isValid: true,
      details: row.details || '',
      type: row.type.toString() || '',
      isDeleted: false
    }));

  }

  /**
   * Normalizes the Excel data by trimming and collapsing spaces in the headers.
   * @param data The Excel data to normalize
   * @returns The normalized data
   */

remapExcelKeys(data: any[]): any[] {
  const keyMap: Record<string, string> = this.columnMapping;

  return data
    .map(row => {
      const remappedRow: any = {};
      for (const rawKey in row) {
        const trimmedKey = rawKey.trim().replace(/\s+/g, ' ');
        const mappedKey = keyMap[trimmedKey];
        if (mappedKey) {
          remappedRow[mappedKey] = row[rawKey];
        }
      }
      return remappedRow;
    })
    .filter(remappedRow => {
      // Keep only rows with at least one non-empty, non-null, non-undefined value
      return Object.values(remappedRow).some(value =>
        value !== null && value !== undefined && value !== ''
      );
    });
}



  /**
    * Maps the Excel column names to the corresponding database column names.
    */
  mapDataToDatabaseColumns() {
    if (!this.columnMapping || Object.keys(this.columnMapping).length === 0) return;

    this.excelData = this.excelData.map(row => {
      const mappedRow: any = {};
      Object.keys(row).forEach(excelColumn => {
        const dbColumn = this.columnMapping[excelColumn] || excelColumn;
        mappedRow[dbColumn] = row[excelColumn];
      });
      return mappedRow;
    });
  }

  /**
   * Extracts the headers from the Excel worksheet.
   * @param worksheet The worksheet to extract headers from
   * @returns An array of header strings
   */

  // getExcelHeaders(sheet: XLSX.WorkSheet): string[] {
  //   // const headerRowNumber = this.headerIndexNumber;
  //   // const headers: string[] = [];

  //   // const range = XLSX.utils.decode_range(sheet['!ref'] || '');

  //   // for (let col = range.s.c; col <= range.e.c; col++) {
  //   //   const cellAddress = XLSX.utils.encode_cell({ c: col, r: headerRowNumber });
  //   //   const cell = sheet[cellAddress];
  //   //   if (cell && cell.v !== undefined && cell.v !== null && cell.v.toString().trim() !== '') {
  //   //     headers.push(cell.v.toString().trim());
  //   //   }
  //   // }
   
  //   const headers: string[] = this.excelService.getExcelHeaders(sheet, this.headerIndexNumber);
  //   return headers;
  // }




  /**
   * Validates the headers in the Excel file against the expected headers.
   * @param headers The headers extracted from the Excel file
   * @returns True if the headers match the expected headers, false otherwise
   */
  validateHeaders(headers: string[]): boolean {

    const isValid = this.excelService.validateHeaders(headers, this.expectedHeaders);

  if (!isValid) {
    this.validationErrors.push('The file is not valid. Make sure you are using the correct template.');
  }
  return isValid;
  }
  /**
 * Emits the uploaded file and its parsed data if the file is valid.
 * Closes the dialog after emitting the event.
 */
  upload() {
    this.isShowingProgressBar = false;
    if (this.isFileValid && this.selectedFile && this.excelData.length > 0) {
      this.uploadedfileName = '';
      const inputElement = this.fileInput.nativeElement;
      inputElement.value = '';
      this.isFileValid = false;


      this.onUploadFile.emit({
        file: this.selectedFile,
        data: this.excelData
      });
    } else {
      this.isFileValid = false;
      this.uploadedfileName = '';
      this.validationErrors.push('Upload failed: File is invalid or contains no data.');
    }
  }

  /**
   * mapping odin raw data drilling excel sheet
   */
  mapRawdataDrillingData() {

    this.mappedOdinDrillingData = this.excelData.map((row: any): RawDataUpload => ({
      materialId: row.MaterialId,
      description: row.Description || '',
      transactionType: row.TransactionType || '',
      expectedDeliveryDate: this.excelDateToJSDate(row.ExpectedDeliveryDate) || null,
      quantity: row.Quantity || '',
      addtoStartingInventory: row.AddtoStartingInventory || 0,
      wellNumber: row.WellNumber || 0,
      supplier: row.Supplier || 0,
      productType: row.ProductType || 0,
      orderComments: row.OrderComments || '',
      shipmentForecastedQuantity: Number(row.ShipmentForecastedQuantity),
      connection: row.Connection || '',
      pricePerFoot: row.PricePerFoot || '',
      orderNumber: row.OrderNumber,
      orderStatus: row.OrderStatus || ''
    }));
    let supplier = this.selectedTabView ? this.selectedTabView : 'Vallourec'; // it will filter only selected supplier record's
    this.excelData = this.mappedOdinDrillingData.filter(x => x.supplier == supplier);

  }


  /**
   * 
   * @param serial it will convert date serial to date
   * @returns 
   */
  excelDateToJSDate(serial: number | null | undefined): Date | null {
    if (serial == null || isNaN(serial)) return null;

    // Adjust for Excel leap year bug
    const correctedSerial = serial > 60 ? serial - 1 : serial;

    // Excel epoch starts at 1899-12-30
    const baseDate = new Date(Date.UTC(1899, 11, 30)); // UTC date
    const utcMillis = correctedSerial * 24 * 60 * 60 * 1000;

    const result = new Date(baseDate.getTime() + utcMillis);
    return result;
  }





  /**
   * 
   * @param date it will format date using date pipe
   * @returns 
   */
  formatDate(date: Date): string {
    const formatted = this.datePipe.transform(date, 'MM/dd/yyyy');
    return formatted ?? ''; // fallback if null
  }

  /**
   * on the basis of screen like raw data, schematic mapping data
   */
  mapExcelDataByScreen(): void {

    const supplier = this.selectedTabView || 'Vallourec';
    //switch case will map data accoridng to condtion
    switch (this.bulkUploadScreen) {
      case 'bulkUploadOdinDrilling':
        this.mappedOdinDrillingData = this.mapExcelData<RawDataUpload>(
          this.excelData,
          (row: any): RawDataUpload => ({
            materialId: row.MaterialId,
            description: row.Description || '',
            transactionType: row.TransactionType || '',
            expectedDeliveryDate: this.excelDateToJSDate(row.ExpectedDeliveryDate) || null,
            quantity: row.Quantity || '',
            addtoStartingInventory: row.AddtoStartingInventory || 0,
            wellNumber: row.WellNumber || 0,
            supplier: row.Supplier || 0,
            productType: row.ProductType || 0,
            orderComments: row.OrderComments || '',
            shipmentForecastedQuantity: Number(row.ShipmentForecastedQuantity),
            connection: row.Connection || '',
            pricePerFoot: row.PricePerFoot || '',
            orderNumber: row.OrderNumber,
            orderStatus: row.OrderStatus || ''
          }),
          (item: RawDataUpload) => item.supplier === supplier
        );
        this.excelData = this.mappedOdinDrillingData;
        break;
      case tenarisScreen:
        this.mappedTenarisOrderData = this.mapExcelData<TenarisUpload>(
          this.excelData,
          (row: any): TenarisUpload => ({
            materialId: row.MaterialId,
            transactionType: row.TransactionType || '',
            expectedDeliveryDate: this.excelDateToJSDate(row.ExpectedDeliveryDate) || null,
            quantity: row.Quantity || 0,
            userIdCreatedBy: +this.userDetail.uid,
            description: row.Description,
            unitPrice: row.unitPrice
          }),


        );
        this.excelData = this.mappedTenarisOrderData;
        break;
      case vallorecScreen:

        this.mappedVallorecOrderData = this.mapExcelData<VallourecUpload>(
          this.excelData,
          (row: any): VallourecUpload => ({
            materialId: row.MaterialId,
            productType: row.ProductType || '',
            expectedDeliveryDate: this.excelDateToJSDate(row.ExpectedDeliveryDate) || null,
            orderQty: row.OrderQty || 0,
            orderComments: row.OrderComments || '',
            orderStatus: row.OrderStatus || '',
            shipmentForeCastQty: row.ShipmentForeCastQty || 0,
            connection: '',
            pricePerFoot: row.PricePerFoot || 0,
            userIdCreatedBy: +this.userDetail.uid,
            longDescription: row.LongDescription || ''
          }),


        );
        this.excelData = this.mappedVallorecOrderData;
        break;

      case LhScreen:
        this.mappedLhandWellHeadOrderData = this.mapExcelData<LhAndWellHeadUpload>(
          this.excelData,
          (row: any): LhAndWellHeadUpload => ({
            supplier: row.Supplier,
            materialType: row.MaterialType || '',
            materialNumber: row.MaterialNumber || '',
            description: row.Description || '',
            plantCode: row.PlantCode || '',
            supplierPartNumber: row.SupplierPartNumber || '',
            pONumber: row.PONumber || '',
            heatNumber: row.HeatNumber || '',
            orderDate: this.excelDateToJSDate(row.OrderDate) || null,
            wBS: row.WBS || '',
            project: row.Project || '',
            unitCost: row.UnitCost || 0,
            quantity: row.Quantity || 0,
            estimatedDeliveryDate: this.excelDateToJSDate(row.EstimatedDeliveryDate) || null,
            newOrderLeadTimeDays: row.NewOrderLeadTimeDays || 0,
            comments: row.Comments || '',
            userIdCreatedBy: +this.userDetail.uid,
          }),


        );
        this.excelData = this.mappedLhandWellHeadOrderData;
        break;
      case wellHeadScreen:

        this.mappedWellHeadOrderData = this.mapExcelData<WellHeadUpload>(
          this.excelData,
          (row: any): WellHeadUpload => ({
            due: this.excelDateToJSDate(row.Due),
            orderLine: row.OrderLine || '',
            pONumber: row.PONumber || '',
            mmnumber: row.MaterialNumber || '',
            cpNum: row.CPNum || '',
            customerDistrict: row.CustomerDistrict || '',
            orderNo: row.OrderNo || 0,
            item: row.Item || '',
            qtyOpen: row.QtyOpen || 0,
            description: row.Description || '',
            salesValue: row.SalesValue || 0,
            costValue: row.CostValue || 0,
            netAvail: row.NetAvail || 0,
            currentNet: row.CurrentNet || 0,
            orderDate: row.OrderDate || null,
            coord: row.Coord || '',
            typeofWork: row.TypeofWork || '',
            ordStatus: row.OrdStatus || '',
            mTRJob: row.MTRJob || '',
            jobStatus: row.JobStatus || '',
            comment: row.Comment || '',
            delivery: row.Delivery || '',
            userIdCreatedBy: +this.userDetail.uid,
          }),


        );
        this.excelData = this.mappedWellHeadOrderData;

        break;
      case inventoryScreen:

        this.mappedInventoryOrderData = this.mapExcelData<InventoryUpload>(
          this.excelData,
          (row: any): InventoryUpload => ({
            id: row.ID || '',
            inventoryItemId: row.InventoryItemID || '',
            oldInventoryItemId: row.OldInventoryItemID || '',
            sourceSystem: row.SourceSystem || '',
            originalSourceSystem: row.OriginalSourceSystem || '',
            businessUnitId: row.BusinessUnitID || '',
            plantCode: row.PlantCode || '',
            plantName: row.PlantName || '',
            storageLocationDesc: row.StorageLocationDesc || '',
            storageLocationCode: row.StorageLocationCode || '',
            storageBin: row.StorageBin || '',
            batch: row.Batch || '',
            wbsElementId: row.WbsElementID || '',
            wbsElementDesc: row.WbsElementDesc || '',
            asset: row.Asset || '',
            category2Bucket: row.Category2Bucket || '',
            category1Asset: row.Category1Asset || '',
            materialId: row.MaterialID || '',
            serialNumber: row.SerialNumber || '',
            oldMaterialNumber: row.OldMaterialNumber || '',
            materialType: row.MaterialType || '',
            materialShortDesc: row.MaterialShortDesc || '',
            materialLongDesc: row.MaterialLongDesc || '',
            manufacturingPartNumber: row.ManufacturingPartNumber || '',
            tier: row.Tier || '',
            od: row.OD || 0,
            wallThickness: row.WallThickness || 0,
            weight: row.Weight || '',
            grade: row.Grade || '',
            connection: row.Connection || '',
            sourService: row.SourService || '',
            uoM: row.UoM || '',
            aUoM: row.AUoM || '',
            materialCondition: row.MaterialCondition || '',
            enterpriseCategory: row.EnterpriseCategory || '',
            segment: row.Segment || '',
            family: row.Family || '',
            class: row.Class || '',
            mrpType: row.MRPType || '',
            mrpArea: row.MRPArea || '',
            mrpTypeAtMrpArea: row.MRPTypeAtMRPArea || '',
            mrpTypeAtPlant: row.MRPTypeAtPlant || '',
            purchaseGroup: row.PurchaseGroup || '',
            externalMaterialGroup: row.ExternalMaterialGroup || '',
            materialGroup: row.MaterialGroup || '',
            criticalCode: row.CriticalCode || '',
            criticalFlag: row.CriticalFlag || '',
            critical: row.Critical || '',
            materialStatus: row.MaterialStatus || '',
            valuationType: row.ValuationType || '',
            specialStockType: row.SpecialStockType || '',
            jointVenture: row.JointVenture || '',
            maxQuantity: row.MaxQuantity || 0,
            minQuantity: row.MinQuantity || 0,
            onHandQuantity: row.OnHandQuantity || 0,
            blockQuantity: row.BlockQuantity || 0,
            aUoMQuantity: row.AUoMQuantity || 0,
            totalQuantity: row.TotalQuantity || 0,
            unitPriceLocal: row.UnitPriceLocal || 0,
            unitPriceUsd: row.UnitPriceUSD || 0,
            amountLocal: row.AmountLocal || 0,
            amountUsd: row.AmountUSD || 0,
            valuatedAmountUsd: row.ValuatedAmountUSD || 0,
            valuatedAmountLocal: row.ValuatedAmountLocal || 0,
            netBookValue: row.NetBookValue || 0,
            openPoQuantity: row.OpenPOQuantity || 0,
            openPoValue: row.OpenPOValue || 0,
            leadTime: row.LeadTime || 0,
            forecastQuantity: row.ForecastQuantity || 0,
            nonMovingLastIssueDate: row.NonMovingLastIssueDate ? this.excelDateToJSDate(row.NonMovingLastIssueDate) : null,
            ageingCalculationDate: row.AgeingCalculationDate ? this.excelDateToJSDate(row.AgeingCalculationDate) : null,
            lastUsedDateByBu: row.LastUsedDateByBU ? this.excelDateToJSDate(row.LastUsedDateByBU) : null,
            lastUsedDateByPlant: row.LastUsedDateByPlant ? this.excelDateToJSDate(row.LastUsedDateByPlant) : null,
            lastMovementDateByPlant: row.LastMovementDateByPlant ? this.excelDateToJSDate(row.LastMovementDateByPlant) : null,
            assemblyId: row.AssemblyID || '',
            itemType: row.ItemType || '',
            supplier: row.Supplier || '',
            supplierPartNumber: row.SupplierPartNumber || '',
            vendor: row.Vendor || '',
            expectedDate: row.ExpectedDate ? this.excelDateToJSDate(row.ExpectedDate) : null,
            manufacturer: row.Manufacturer || '',
            manufacturerDate: row.ManufacturerDate ? this.excelDateToJSDate(row.ManufacturerDate) : null,
            size: row.Size || '',
            length: row.Length || 0,
            documentNumber: row.DocumentNumber || '',
            documentLineNumber: row.DocumentLineNumber || '',
            commodityCode: row.CommodityCode || '',
            commodityCodeDesc: row.CommodityCodeDesc || '',
            demandFlag: row.DemandFlag || false,
            moveQuantity: row.MoveQuantity || 0,
            costCenterId: row.CostCenterID || '',
            costCenterName: row.CostCenterName || '',
            surplusFlag: row.SurplusFlag || false,
            hashDiff: row.HashDiff || '',
            deleted: row.Deleted || false,
            createdTs: this.excelDateToJSDate(row.CreatedTS) || null,
            lastUpdatedTs: this.excelDateToJSDate(row.LastUpdatedTS) || null,
            transferOpportunityFlag: row.TransferOpportunityFlag || false,
            derivedLastMovementDate: row.DerivedLastMovementDate ? this.excelDateToJSDate(row.DerivedLastMovementDate) : null,
            ageTimeBucket: row.AgeTimeBucket || '',
            ageByMovementInMonths: row.AgeByMovementInMonths || 0,
            materialAgeInMonths: row.MaterialAgeInMonths || 0,
            lastUsedByBuInMonths: row.LastUsedByBUInMonths || 0,
            proposedStatus: row.ProposedStatus || '',
            proposedReason: row.ProposedReason || '',
            investmentRecoveryStatus: row.InvestmentRecoveryStatus || '',
            orgFunction: row.OrgFunction || '',
            ageTimeBucketSort: row.AgeTimeBucketSort || '',
            crateId: row.CrateID || '',
            crateName: row.CrateName || '',
            tagId: row.TagId || '',
            ageingDate: this.excelDateToJSDate(row.AgeingDate) || null,
            lastUsedDate: this.excelDateToJSDate(row.LastUsedDate) || null,
            ageingMovementType: row.AgeingMovementType || '',
            lastUsedMovementType: row.LastUsedMovementType || '',
            ageingTimeFrame: row.AgeingTimeFrame || '',
            lastUsedTimeFrame: row.LastUsedTimeFrame || '',
            lastMovementTimeFrame: row.LastMovementTimeFrame || '',
            valuationClass: row.ValuationClass || '',
            mmrLevel1Category: row.MMRLevel1Category || '',
            mmrLevel2Category: row.MMRLevel2Category || '',
            mmrLevel3Category: row.MMRLevel3Category || '',
            chevronMmr: row.ChevronMMR || '',
            connectionConfiguration: row.ConnectionConfiguration || '',
            qualityPlan: row.QualityPlan || '',
            readyForServiceDate: row.ReadyForServiceDate || null,
            userIdCreatedBy: +this.userDetail.uid
          })
        );

        this.excelData = this.mappedInventoryOrderData;

        break;
      case mitiScreen:

        this.mappedMitiHeadOrderData = this.mapExcelData<MitiUpload>(
          this.excelData,
          (row: any): MitiUpload => ({
            contract: row.Contract || '',
            suppplier: row.Suppplier || '',
            mitiSoNo: row.MitiSoNo || '',
            description: row.Description || '',
            cvxPo: row.CVXPo || '',
            project: row.Project || '',
            cvxEngineer: row.CVXEngineer || '',
            well: row.Well || '',
            wbs: row.WBS || '',
            cvxMM: row.CVXMM || '',
            soonerSNNo: row.SoonerSNNo || '',
            lineNumber: row.LineNumber || '',
            comm: row.Comm || '',
            grade: row.Grade || '',
            odin: row.ODIN || '',
            wtin: row.WTIN || '',
            wtLbsPerFt: +row.WTLbsPerFt || 0,
            lengthFt: row.LengthFt || '',
            end: row.End || '',
            quantityFt: +row.QuantityFt || 0,
            quantityPc: +row.QuantityPc || 0,
            cvxRequiredDeliveryMonthYear: row.CVXRequiredDeliveryMonthYear || '',
            partial: row.Partial || '',
            vessel: row.Vessel || '',
            etd: row.ETD ? this.excelDateToJSDate(row.ETD) : null,
            eta: row.ETA ? this.excelDateToJSDate(row.ETA) : null,
            deliveryDate: row.DeliveryDate ? this.excelDateToJSDate(row.DeliveryDate) : null,
            receivingReport: row.ReceivingReport || '',
            status: row.Status || '',
            soPriceMatOnly: +row.SOPriceMatOnly || 0,
            userIdCreatedBy: +this.userDetail.uid
          })
        );

        this.excelData = this.mappedMitiHeadOrderData;

        break;
        case yardInventoryScreen:

        this.mappedYardInventoryOrderData = this.mapExcelData<YardInventoryUpload>(
          this.excelData,
          (row: any): YardInventoryUpload => ({
            materialId: row.MaterialNumber || '',
            productName: row.ProductName || '',
            lotOrSerialNumber: row.LotSerialNumber || '',
            location: row.Location || '',
            stockingLocation: row.StockingLocation || '',
            length: row.Length || 0.00,
            heatNumber: row.HeatNumber || '',
            class: row.Class || '',
            condition: row.Condition || '',
            accessory: row.Accessory || '',
            sonumber: row.SONumber || '',
            wellName: row.WellName || '',
            wbs: row.WBS || '',
            project: row.Project || '',
            plantCode: row.PlantCode || '',
            Sloccode: row.SLOCCode || '',
            userIdCreatedBy: +this.userDetail.uid
          }),


        );
        this.excelData = this.mappedYardInventoryOrderData;

        break;
      default:
        this.mappedClampsData = this.mapExcelData<SchematicClamps>(
          this.excelData,
          (row: any): SchematicClamps => ({
            id: 0,
            schematicId: this.schematicId,
            materialKey: row.materialKey || '',
            materialNumber: row.materialNumber || '',
            manufacturerPart: row.manufacturerPart?.toString() || '',
            halliburtonPart: row.halliburtonPart?.toString() || '',
            primaryDemand: Number(row.primaryDemand) || 0,
            totalQty: Number(row.totalQty) || 0,
            contingencyDemand: Number(row.contingencyDemand) || 0,
            userId: Number(this.userDetail?.uid) || 0,
            isValid: true,
            details: row.details || '',
            type: row.type?.toString() || '',
            isDeleted: false
          })
        );
        break;
    }
  }

  /**
   * generic method to map excel sheet records
   * @param excelData 
   * @param mapFn 
   * @param filterFn 
   * @returns 
   */
  mapExcelData<T>(
    excelData: any[],
    mapFn: (row: any) => T,
    filterFn?: (item: T) => boolean
  ): T[] {
    const mapped = excelData.map(mapFn);
    return filterFn ? mapped.filter(filterFn) : mapped;
  }
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
  // Drag leave event handler
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
  // Drop event handler
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.processSelectedFile(file);
    }
  }

  /**
   * clear the file upload
   */
  clearFileUpload() {
    this.uploadedfileName = '';
    const inputElement = this.fileInput?.nativeElement;
    if (inputElement)
      inputElement.value = '';
  }
  /**
   * it will detect changes
   * @param changes 
   */
  ngOnChanges(changes: SimpleChanges): void {

    if (changes.isDialogClose) {
      this.isShowingProgressBar = false;
      this.clearFileUpload();
    }
  }
  
  /**
   * this will download the sample template from S3 buckets
   */

    downloadTemplate() {
    const key = ClampTemplate;
    this.excelService.downloadTemplate(key);
  }
}
