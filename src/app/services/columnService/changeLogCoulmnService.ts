import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { CustomDeleteButton } from '../../modules/schematic/customDeleteButton.component';
import { AuthService } from '../auth.service';
import { AccessControls } from '../../common/constant';
import { CommonService } from '../common.service';


@Injectable({
  providedIn: 'root',
})

export class ColumnService {
  mitiColumnDef: ColDef[];
  constructor(private authService: AuthService,
    private commonService: CommonService,) {
  
  }
  mdlChangeLogColumnDefs: ColDef[] = [
    { headerName: '# ', field: 'auditId', sortable: true, filter: true },
    {
      headerName: 'Date',
      field: 'changeDate',
      valueFormatter: (params) => {
        const date = new Date(params.value);  // Convert the value into a Date object
        if (!isNaN(date.getTime())) { // Check if the date is valid
          // Extract the day, month, and year
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
          const year = date.getFullYear();

          // Format the date as MM/DD/YYYY
          return `${month}/${day}/${year}`;
        }
        return params.value; // Return the original value if it's not a valid date
      },
      getQuickFilterText: (params) => {
        const date = new Date(params.value);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        }
        return '';
      },
      sortable: true, filter: true
    },
    { headerName: 'MM', field: 'materialNumber', sortable: true, filter: true },
    { headerName: 'Supplier Part #', field: 'supplierPartNumber', sortable: true, filter: true },
    { headerName: 'Description', field: 'materialDescription', sortable: true, filter: true },

    { headerName: 'Attribute', field: 'columnName', sortable: true, filter: true },

    {
      headerName: 'Original',
      field: 'oldValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }
        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    {
      headerName: 'Change',
      field: 'newValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }
        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    { headerName: 'User', field: 'userName', sortable: true, filter: true },
    {
      headerName: 'Action', field: 'actionName',
      valueGetter: function (params) {
        const action = params.data.actionName;
        if (action === 'I') return 'Insert';
        if (action === 'U') return 'Update';
        if (action === 'D') return 'Delete';
        return action; // In case of an unknown value
      },
      sortable: true, filter: true
    },
  ];
  schemticChangeColumnDefs: ColDef[] = [
    { headerName: '# ', field: 'auditId', sortable: true, filter: true },
    {
      headerName: 'Date',
      field: 'changeDate',
      valueFormatter: (params) => {
        const date = new Date(params.value);  // Convert the value into a Date object
        if (!isNaN(date.getTime())) { // Check if the date is valid
          // Extract the day, month, and year
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
          const year = date.getFullYear();

          // Format the date as MM/DD/YYYY
          return `${month}/${day}/${year}`;
        }
        return params.value; // Return the original value if it's not a valid date
      },
      getQuickFilterText: (params) => {
        const date = new Date(params.value);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        }
        return '';
      },
    },

    { headerName: 'Schematic Name', field: 'schematicName', sortable: true, filter: true },

    { headerName: 'Attribute', field: 'columnName', sortable: true, filter: true },
    {
      headerName: 'Original',
      field: 'oldValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }

        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    {
      headerName: 'Change',
      field: 'newValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }
        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    { headerName: 'User', field: 'userName', sortable: true, filter: true },
    {
      headerName: 'Action', field: 'actionName',
      valueGetter: function (params) {
        const action = params.data.actionName;
        if (action === 'I') return 'Insert';
        if (action === 'U') return 'Update';
        if (action === 'D') return 'Delete';
        return action; // In case of an unknown value
      },
      sortable: true, filter: true
    },
  ];

  schemticDetailsChangeColumnDefs: ColDef[] = [
    { headerName: '# ', field: 'auditId', sortable: true, filter: true },
    {
      headerName: 'Date',
      field: 'changeDate',
      valueFormatter: (params) => {
        const date = new Date(params.value);  // Convert the value into a Date object
        if (!isNaN(date.getTime())) { // Check if the date is valid
          // Extract the day, month, and year
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
          const year = date.getFullYear();

          // Format the date as MM/DD/YYYY
          return `${month}/${day}/${year}`;
        }
        return params.value; // Return the original value if it's not a valid date
      },
      getQuickFilterText: (params) => {
        const date = new Date(params.value);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        }
        return '';
      },
    },

    { headerName: 'Schematic Name', field: 'schematicName', sortable: true, filter: true },
    { headerName: 'Item Number', field: 'itemNumber', sortable: true, filter: true },
    { headerName: 'SubItem Number', field: 'subItemNumber', sortable: true, filter: true },
    { headerName: 'Attribute', field: 'columnName', sortable: true, filter: true },
    {
      headerName: 'Original',
      field: 'oldValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }

        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    {
      headerName: 'Change',
      field: 'newValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }
        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    { headerName: 'User', field: 'userName', sortable: true, filter: true },
    {
      headerName: 'Action', field: 'actionName',
      valueGetter: function (params) {
        const action = params.data.actionName;
        if (action === 'I') return 'Insert';
        if (action === 'U') return 'Update';
        if (action === 'D') return 'Delete';
        return action; // In case of an unknown value
      },
      sortable: true, filter: true
    },
  ];

  thorCompletionChangeLogColumnDefs: ColDef[] = [
    { headerName: '# ', field: 'id', sortable: true, filter: true },
    {
      headerName: 'Date',
      field: 'changeDate',
      valueFormatter: (params) => {
        const date = new Date(params.value);  // Convert the value into a Date object
        if (!isNaN(date.getTime())) { // Check if the date is valid
          // Extract the day, month, and year
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
          const year = date.getFullYear();

          // Format the date as MM/DD/YYYY
          return `${month}/${day}/${year}`;
        }
        return params.value; // Return the original value if it's not a valid date
      },
      sortable: true, filter: true
    },
    {
      headerName: 'MM',
      field: 'materialNumber',
      sortable: true,
      filter: true,

    },

    { headerName: 'Attribute', field: 'columnName', sortable: true, filter: true },

    {
      headerName: 'Original',
      field: 'oldValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }
        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    {
      headerName: 'Change',
      field: 'newValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }
        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    { headerName: 'User', field: 'userName', sortable: true, filter: true },
    {
      headerName: 'Action', field: 'actionName',
      valueGetter: function (params) {
        const action = params.data.actionName;
        if (action === 'I') return 'Insert';
        if (action === 'U') return 'Update';
        if (action === 'D') return 'Delete';
        return action; // In case of an unknown value
      },
      sortable: true, filter: true
    },
  ];

  odinChangeColumnDefs: ColDef[] = [
    { headerName: '# ', field: 'id', sortable: true, filter: true },
    {
      headerName: 'Date',
      field: 'changeDate',
      valueFormatter: (params) => {
        const date = new Date(params.value);  // Convert the value into a Date object
        if (!isNaN(date.getTime())) { // Check if the date is valid
          // Extract the day, month, and year
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
          const year = date.getFullYear();

          // Format the date as MM/DD/YYYY
          return `${month}/${day}/${year}`;
        }
        return params.value; // Return the original value if it's not a valid date
      },
      getQuickFilterText: (params) => {
        const date = new Date(params.value);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        }
        return '';
      },
      
    },

    { headerName: 'Well', field: 'wellName', sortable: true, filter: true },
    { headerName: 'MM', field: 'materialId', sortable: true, filter: true },
    { headerName: 'Attribute', field: 'columnName', sortable: true, filter: true },
    {
      headerName: 'Original',
      field: 'oldValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }

        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    {
      headerName: 'Change',
      field: 'newValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }
        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    { headerName: 'User', field: 'userName', sortable: true, filter: true },
    {
      headerName: 'Action', field: 'actionName',
      valueGetter: function (params) {
        const action = params.data.actionName;
        if (action === 'I') return 'Insert';
        if (action === 'U') return 'Update';
        if (action === 'D') return 'Delete';
        return action; // In case of an unknown value
      },
      sortable: true, filter: true
    },
  ];

  // added column for raw data change log
  rawDataChangeColumnDefs: ColDef[] = [
    { headerName: '# ', field: 'auditId', sortable: true, filter: true },
    {
      headerName: 'Date',
      field: 'changeDate',
      valueFormatter: (params) => {
        const date = new Date(params.value);  // Convert the value into a Date object
        if (!isNaN(date.getTime())) { // Check if the date is valid
          // Extract the day, month, and year
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
          const year = date.getFullYear();

          // Format the date as MM/DD/YYYY
          return `${month}/${day}/${year}`;
        }
        return params.value; // Return the original value if it's not a valid date
      },
      getQuickFilterText: (params) => {
        const date = new Date(params.value);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        }
        return '';
      },
    },

    { headerName: 'Data Source', field: 'dataSource', sortable: true, filter: true },
    { headerName: 'MM', field: 'materialNumber', sortable: true, filter: true },
    { headerName: 'Attribute', field: 'columnName', sortable: true, filter: true },
    {
      headerName: 'Original',
      field: 'oldValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }

        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    {
      headerName: 'Change',
      field: 'newValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }
        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    { headerName: 'User', field: 'userName', sortable: true, filter: true },
    {
      headerName: 'Action', field: 'actionName',
      valueGetter: function (params) {
        const action = params.data.actionName;
        if (action === 'I') return 'Insert';
        if (action === 'U') return 'Update';
        if (action === 'D') return 'Delete';
        return action; // In case of an unknown value
      },
      sortable: true, filter: true
    },
  ];
   mitiColumnDefs: ColDef[] = [
      ...[
        'contract', 'mitisoNo', 'description', 'cvxPo', 'project', 'cvxEngineer',
        'well', 'wbs', 'cvxMm', 'soonerSNNo', 'lineNumber', 'comm', 'grade',
        'odIn', 'wtIn', 'wtLbsPerFt', 'lengthFt', 'end', 'quantityFt', 'quantityPc',
        'cvxRequiredDeliveryMonthYear', 'partial', 'vessel'
      ].map(field => ({
        field,
        headerName: this.getHeader(field),
       // editable: this.authService.isFieldEditable(field)
      })),
      ...['etd', 'eta', 'deliveryDate'].map(field => ({
        field,
        headerName: this.getHeader(field),
        cellEditor: 'agDateCellEditor',
        cellEditorParams: {
          useBrowserDatePicker: true,
        },
        valueGetter: (params: any) => {
          return params.data[field] ?? null;
        },
        valueFormatter: (params: any) => {
          const date = new Date(params.value);
          if (!params.value || isNaN(date.getTime())) return '';
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        },
        onCellValueChanged: (params: any) => {
          const fieldName = field; // keep field reference safe in closure
          const oldVal = params.oldValue ? new Date(params.oldValue) : null;
          const newVal = params.newValue ? new Date(params.newValue) : null;

          if (!newVal || isNaN(newVal.getTime())) {
            if (params.oldValue !== params.newValue && params.data[fieldName] != null) {
              params.api.getRowNode(params.node.id)?.setDataValue(fieldName, params.oldValue);
            }
            return;
          }

          const normalizedNew = new Date(Date.UTC(newVal.getFullYear(), newVal.getMonth(), newVal.getDate()));
          const normalizedOld = oldVal ? new Date(Date.UTC(oldVal.getFullYear(), oldVal.getMonth(), oldVal.getDate())) : null;

          if (!normalizedOld || normalizedOld.getTime() !== normalizedNew.getTime()) {
            params.api.getRowNode(params.node.id)?.setDataValue(fieldName, normalizedNew);
          }
        }

      })),
      { field: 'receivingReport', headerName: 'Receiving Report', },
      { field: 'status', headerName: 'Status',  },
      { field: 'sopriceMatOnly', headerName: 'SO Price (Mat. ONLY)'},
    ];
  //added column for raw data MIti 

  // mitiColumnDef:ColDef[]=[
  //   { field: 'contract', headerName: 'Contract',editable: true },
  //   { field: 'mitisoNo', headerName: 'MITISO No',editable: true },
  //   { field: 'description', headerName: 'Description',editable: true },
  //   { field: 'cvxPo', headerName: 'CVX PO',editable: true },
  //   { field: 'project', headerName: 'Project',editable: true },
  //   { field: 'cvxEngineer', headerName: 'CVX Engineer',editable: true },
  //   { field: 'well', headerName: 'Well',editable: true },
  //   { field: 'wbs', headerName: 'WBS',editable: true },
  //   { field: 'cvxMm', headerName: 'CVX MM#',editable: true },
  //   { field: 'soonerSNNo', headerName: 'Sooner SO',editable: true },
  //   { field: 'lineNumber', headerName: 'Line No',editable: true },
  //   { field: 'comm', headerName: 'Comm',editable: true },
  //   { field: 'grade', headerName: 'Grade',editable: true },
  //   { field: 'odIn', headerName: 'OD (in)',editable: true },
  //   { field: 'wtIn', headerName: 'WT (in)',editable: true },
  //   { field: 'wtLbsPerFt', headerName: 'WT (lbs/ft)',editable: true },
  //   { field: 'lengthFt', headerName: 'Length (ft)',editable: true },
  //   { field: 'end', headerName: 'End',editable: true },
  //   { field: 'quantityFt', headerName: '(Ft)',editable: true },
  //   { field: 'quantityPc', headerName: '(Pc)',editable: true },
  //   { field: 'cvxRequiredDeliveryMonthYear', headerName: '*CVX Req. Del. (Mth/Yr)',editable: true },
  //   { field: 'partial', headerName: 'Partial',editable: true },
  //   { field: 'vessel', headerName: 'Vessel',editable: true },
  //   { field: 'etd', headerName: 'ETD',editable: true, 
  //     valueFormatter: (params) => {
  //       const date = new Date(params.value);

  //       // Check if the value is a valid date
  //       if (!params.value || isNaN(date.getTime())) {
  //         return '';  // Return empty string for invalid or null date
  //       }

  //       // Format valid date as MM/dd/yyyy
  //       const day = String(date.getDate()).padStart(2, '0');
  //       const month = String(date.getMonth() + 1).padStart(2, '0');
  //       const year = date.getFullYear();
  //       return `${month}/${day}/${year}`;
  //     }, 
  //    },
  //   { field: 'eta', headerName: 'ETA' , valueFormatter: (params) => {
  //       const date = new Date(params.value);

  //       // Check if the value is a valid date
  //       if (!params.value || isNaN(date.getTime())) {
  //         return '';  // Return empty string for invalid or null date
  //       }

  //       // Format valid date as MM/dd/yyyy
  //       const day = String(date.getDate()).padStart(2, '0');
  //       const month = String(date.getMonth() + 1).padStart(2, '0');
  //       const year = date.getFullYear();
  //       return `${month}/${day}/${year}`;
  //     }, 

  //   },
  //   { field: 'deliveryDate', headerName: 'Delivery Date' , valueFormatter: (params) => {
  //       const date = new Date(params.value);

  //       // Check if the value is a valid date
  //       if (!params.value || isNaN(date.getTime())) {
  //         return '';  // Return empty string for invalid or null date
  //       }

  //       // Format valid date as MM/dd/yyyy
  //       const day = String(date.getDate()).padStart(2, '0');
  //       const month = String(date.getMonth() + 1).padStart(2, '0');
  //       const year = date.getFullYear();
  //       return `${month}/${day}/${year}`;
  //     }, 
  //   },
  //   { field: 'receivingReport', headerName: 'Receiving Report' },
  //   { field: 'status', headerName: 'Status' },
  //   { field: 'sopriceMatOnly', headerName: 'SO Price (Mat. ONLY)' }

  // ];

  getHeader(field: string): string {
    const headers: Record<string, string> = {
      contract: 'Contract',
      mitisoNo: 'MITISO No',
      description: 'Description',
      cvxPo: 'CVX PO',
      project: 'Project',
      cvxEngineer: 'CVX Engineer',
      well: 'Well',
      wbs: 'WBS',
      cvxMm: 'CVX MM#',
      soonerSNNo: 'Sooner SO',
      lineNumber: 'Line No',
      comm: 'Comm',
      grade: 'Grade',
      odIn: 'OD (in)',
      wtIn: 'WT (in)',
      wtLbsPerFt: 'WT (lbs/ft)',
      lengthFt: 'Length (ft)',
      end: 'End',
      quantityFt: '(Ft)',
      quantityPc: '(Pc)',
      cvxRequiredDeliveryMonthYear: '*CVX Req. Del. (Mth/Yr)',
      partial: 'Partial',
      vessel: 'Vessel',
      etd: 'ETD',
      eta: 'ETA',
      deliveryDate: 'Delivery Date',
    };
    return headers[field] || field;
  }


  // change log column def for the tyr

    tyrChangeColumnDefs: ColDef[] = [
    { headerName: 'Change ID', field: 'auditId', sortable: true, filter: true },
    { headerName: 'Task ID', field: 'taskId', sortable: true, filter: true },
    {
      headerName: 'Date',
      field: 'changeDate',
      valueFormatter: (params) => {
        const date = new Date(params.value);  // Convert the value into a Date object
        if (!isNaN(date.getTime())) { // Check if the date is valid
          // Extract the day, month, and year
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
          const year = date.getFullYear();

          // Format the date as MM/DD/YYYY
          return `${month}/${day}/${year}`;
        }
        return params.value; // Return the original value if it's not a valid date
      },
      getQuickFilterText: (params) => {
        const date = new Date(params.value);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        }
        return '';
      },
      
    },
   
    { headerName: 'Attribute', field: 'columnName', sortable: true, filter: true },
    {
      headerName: 'Original',
      field: 'oldValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }

        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    {
      headerName: 'Change',
      field: 'newValue',
      valueFormatter: (params) => {
        // Ensure the value is not null or undefined
        if (params.value != null) {

          // Check if the value is a number
          if (!isNaN(params.value)) {
            const value = params.value.toString();

            // If the value is in scientific notation (contains 'e')
            if (value.includes('e')) {
              return parseFloat(params.value).toFixed(2);  // Format number with 2 decimal places
            }
            return params.value;  // Return the number as-is if not in scientific notation
          }

          // Regular expression to match ISO 8601 datetime format (e.g., "2024-11-12T14:30:00Z")
          const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?/;

          // Check if the value matches the datetime regex
          if (isoDateRegex.test(params.value)) {
            const date = new Date(params.value);
            if (!isNaN(date.getTime())) {
              // If it's a valid date, format it as mm/dd/yyyy
              const month = ('0' + (date.getMonth() + 1)).slice(-2);  // Month is zero-based
              const day = ('0' + date.getDate()).slice(-2);
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;  // Return the date in mm/dd/yyyy format
            }
          }
        }

        // Return the value as-is if it's neither a number nor a valid date
        return params.value;
      },
      sortable: true,
      filter: true
    }
    ,
    { headerName: 'User', field: 'userName', sortable: true, filter: true },
    {
      headerName: 'Action', field: 'actionName',
      valueGetter: function (params) {
        const action = params.data.actionName;
        if (action === 'I') return 'Add';
        if (action === 'U') return 'Edit';
        if (action === 'D') return 'Delete';
        return action; // In case of an unknown value
      },
      sortable: true, filter: true
    },
  ];
  //default column definiton
  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true
  };
}