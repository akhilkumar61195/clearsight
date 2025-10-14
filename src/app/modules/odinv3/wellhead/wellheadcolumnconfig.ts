
/**
 * Generates column definitions for the Kit table.
 * @param addComponentCallback - A callback function triggered when the add button is clicked.
 * @returns An array of column definitions for the Kit table.
 */

import { AuthService } from "../../../services";

export const getKitColumnDefs = (addComponentCallback: Function, authService: AuthService) => {
    return [
      { headerName: 'Kit Id', field: 'id', editable: false, hide: true },
      { headerName: 'Kit Name', minWidth: 200, field: 'kitType', editable:authService.isFieldEditable('kitType'), filter: false },
      {
        headerName: '',
        cellRenderer: () => {
          return `
          <button
            pButton
            type="button"
            label=""
            class="p-ripple p-element chv-light-blue-btnsm p-button p-component custom-button-class delete-bg-transparent "
            data-action="delete">
            <i class="pi pi-plus-circle add-button-icon pr-2" data-action="delete"></i>
          </button>
        `;
        },
        editable: false,
        cellClass: 'action-button-add',
        filter: false,
        maxWidth: 60,
        onCellClicked: (params: any) => {
            if (authService.isFieldEditable('kitType')) {
          addComponentCallback(params.data);
            }
        }
      }
    ];
  };

  /**
 * Generates column definitions for the Component Kit table.
 * @param updateEditedData - A callback function triggered when the quantity is updated.
 * @returns An array of column definitions for the Component Kit table.
 */

  export const getComponentKitColumnDefs = (updateEditedData: Function , authService: AuthService) => {
    return [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        headerName: '',
        maxWidth: 50,
        editable: false,
        filter: false,
      },
      { headerName: 'Id', field: 'id', editable: false, hide: true },
      { headerName: 'Kit Id', field: 'kitTypeId', editable: false, hide: true },
      { headerName: 'Kit Name', maxWidth: 250, field: 'kitType', editable: false, filter: true },
      { headerName: 'SAP MM', maxWidth: 200, field: 'materialId', editable: false, filter: true },
      { headerName: 'Description', minWidth: 700, field: 'materialShortDesc', editable: false, filter: true },
      { headerName: 'Manufacturer #', field: 'manufacturerNum', editable: false, filter: true },
      {
        headerName: 'Qty or Ft',
        field: 'qty',
        editable:authService.isFieldEditable('qty'),
        filter: true,
        valueSetter: (params) => {
          const newValue = params.newValue;
          const oldValue = params.data.qty;
          if (newValue !== oldValue) {
            params.data.qty = newValue;
            updateEditedData(params.data);
            return true;
          }
          return false;
        }
      }
    ];
  };
  