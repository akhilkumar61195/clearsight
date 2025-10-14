import { ColDef } from 'ag-grid-community';
import { Observable, of } from 'rxjs';
import { ConfigEditorConstants } from '../../../common/enum/list-editor-enum';

/**
 * A utility class for creating AG Grid column definitions.
 */
export class ColumnDefBuilder {
  /**
   * Creates a single-column definition.
   * @param headerName - The display name of the column.
   * @param fieldName - The field name bound to the data.
   * @param type - Optional type (not used here, but could be extended).
   * @returns A column definition array.
   */
  public createColumnDefs(headerName: string, fieldName: string, type: string): ColDef[] {
    return [
      {
        headerName,
        field: fieldName,
        editable: true,
        sortable: true,
        filter: false,
        checkboxSelection: true
      }
    ];
  }

  readerColumns(configTypes: any): Observable<boolean> {
    configTypes.forEach((type) => {
      type[ConfigEditorConstants.COLUMN_DEFS] = new ColumnDefBuilder().createColumnDefs(type.configText, ConfigEditorConstants.VALUE, '');
    });
    return of(true);
  }
}
