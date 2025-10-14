import { ColDef } from 'ag-grid-community';
import { ColDefTables } from '../../common/enum/common-enum';

export function InitializeColumnDefs(tableType: string): ColDef[] {

  switch (tableType) {

    case ColDefTables.Perforations:
      return [
        { headerName: 'Zone', field: 'zoneID', minWidth: 80, maxWidth: 100, filter: false, sortable: true, editable: false, },
        { headerName: 'Description', field: 'perforationDescription', minWidth: 250, maxWidth: 350, editable: false, sortable: true, filter: false },
        //{ headerName: 'Depth (MD)', field: 'perforationDepth', editable: true, sortable: true, minWidth: 180, maxWidth: 200, filter: true },
        {
          headerName: 'Depth (MD)',
          field: 'perforationDepth',
          editable: true,
          sortable: true,
          minWidth: 180,
          maxWidth: 200,
          filter: true,
          valueFormatter: (params: any) => {
            return params.value !== undefined && params.value !== null ? parseFloat(params.value).toFixed(2) : '';
          },
          valueSetter: (params: any) => {
            const newValue = parseFloat(params.newValue);
            if (!isNaN(newValue)) {
              params.data[params.colDef.field] = newValue.toFixed(2);
              return true;
            }
            return false;
          }
        },
        /*{ headerName: 'Zone Length (MD)', field: 'lengthOfPZone', editable: false, sortable: false, minWidth: 180, maxWidth: 200, filter: false },*/
        {
          headerName: 'Zone Length (MD)',
          field: 'lengthOfPZone',
          editable: false,
          sortable: false,
          minWidth: 180,
          maxWidth: 200,
          filter: false,
          //valueFormatter: (params: any) => {
          //  return params.value !== undefined ? params.value.toFixed(2) : ''; // Show 2 decimal places
          //}
          valueFormatter: (params: any) => {
            const rowIndex = params.node.rowIndex;
            if (rowIndex % 2 === 0) {
              return '';
            } else {
              return params.value !== undefined ? params.value.toFixed(2) : '';
            }
          }
        },
        //{ headerName: 'Perf to Perf Length', field: 'perfToPerfLength', editable: false, sortable: false, minWidth: 180, maxWidth: 200, filter: false },
        {
          headerName: 'Perf to Perf Length',
          field: 'perfToPerfLength',
          editable: false,
          sortable: false,
          minWidth: 180,
          maxWidth: 200,
          filter: false,
          valueFormatter: (params: any) => {
            const rowIndex = params.node.rowIndex;
            if (rowIndex % 2 === 0) {
              return params.value !== undefined ? params.value.toFixed(2) : '';
            } else {
              return '';
            }
          }
        },
        { headerName: 'Screen Coverage', field: 'screenCoverage', editable: false, sortable: false, minWidth: 150, maxWidth: 180, filter: false },
      ];
    default:
      return [];
  }
}
