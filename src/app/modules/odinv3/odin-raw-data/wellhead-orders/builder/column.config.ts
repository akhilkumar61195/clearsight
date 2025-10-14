import { ColDef } from 'ag-grid-community';
import { ColumnConfig, wellheadOrdersCols } from '../../columnconfig';
import { AuthService } from '../../../../../services';
import { LocaleTypeEnum } from '../../../../../common/enum/common-enum';

export class ColumnConfigBuilder {
 summaryCols: ColumnConfig[] = wellheadOrdersCols;
  private dateFields = ['due', 'orderDate'];
  private currencyField=['salesValue']
  constructor( private authService: AuthService,) {}

  // Builds and returns an array of ColDef objects for AG Grid
  public buildColumnDefs(): ColDef[] {
    return this.summaryCols.map((col, index) => {
      const isDateField = this.dateFields.includes(col.field);
      // Base column definition
      const colDef: ColDef = {
        headerName: col.header,
        field: col.field,
        sortable: col.sortable !== false,
        filter: true,
        hide: col.field === 'id',
        resizable: true,
        editable:this.authService.isFieldEditable(col.field),
        cellStyle: {
          color: col.textColor,
          'white-space': 'nowrap',
        },
        headerClass: 'header-bold',
        headerTooltip: col.header,
        minWidth: col.width || 150,
        suppressSizeToFit: index === 0,
      };
     // If the field is a date field, apply special configurations
      if (isDateField) {
        colDef.cellEditor = 'agDateCellEditor';
        colDef.cellEditorParams = {
          useBrowserDatePicker: true,
        };
       // Extract the field value for the cell
        colDef.valueGetter = (params) => {
          return params.data?.[col.field] ?? null;
        };
         
        // Format the date value for display as MM/DD/YYYY
        colDef.valueFormatter = (params) => {
          const date = new Date(params.value);
          if (!params.value || isNaN(date.getTime())) return '';
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        };
        // Handle updates to date fields when user edits the value
        colDef.onCellValueChanged = (params) => {
          const newDate = new Date(params.newValue);

          if (!params.newValue || isNaN(newDate.getTime()) || newDate.getTime() === 0) {
            if (params.oldValue === params.newValue || params.data[col.field] != null) return;
            params.api.getRowNode(params.node.id)?.setDataValue(col.field, params.oldValue);
          } else {
            const normalizedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
            if (params.oldValue !== normalizedDate.getTime()) {
              params.api.getRowNode(params.node.id)?.setDataValue(col.field, normalizedDate);
            }
          }
        };
      }
      // Currency field formatting
      if (this.currencyField.includes(col.field)) {
        colDef.valueFormatter = this.currencyFormatter;
        colDef.hide = !this.authService.isFieldEditable(col.field);
      }
      return colDef;
    });
  }
    /**
   * adding $ in amount field
   * @param params 
   * @returns 
   */
  currencyFormatter(params: any): string {
    const value = params.value;
    if (value == null || isNaN(value)) {
      return '';
    }
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return '';
    }
    //return '$' + numericValue.toFixed(2);
    // Format the number as currency with commas and two decimal places
    const formattedValue = numericValue.toLocaleString(LocaleTypeEnum.enUS, { style: 'currency', currency: 'USD' });
    return isNaN(value) ? params.value : formattedValue;
  }
}