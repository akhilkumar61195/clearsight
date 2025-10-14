import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})

export class ExportSchematicMasterTableService
{
    projectColumnDefs: ColDef[] = [
        { headerName: 'Project', field: 'project', sortable: true,filter: true},
        { headerName: 'Lease', field: 'lease', sortable: true,filter: true},
        { headerName: 'Well Name', field: 'wellName', sortable: true,filter: true},
        { headerName: 'Well Location', field: 'wellLocation', sortable: true,filter: true},
        { headerName: 'Chevron Engineer', field: 'chevronEngineer', sortable: true,filter: true},
        { headerName: 'Chevron WBS', field: 'chevronWBS', sortable: true,filter: true},

    ];
    wellFeatureColumnDefs: ColDef[] = [
        { headerName: 'Well Features', field: 'Code', sortable: true,filter: true},
        { headerName: 'Depth (MD) or Length (ft)', field: 'Depth', sortable: true,filter: true},
      
    ];
  
     masterDataExportColumnDefs = [
        { headerName: 'Section', field: 'sectionName', maxWidth: 100 ,filter: true,sortable: true},
        { headerName: 'Design Type', field: 'designType', maxWidth: 130, filter: true, sortable: true, pinned: true },
        { headerName: 'Zone', field: 'zoneID', maxWidth: 180, editable: false, sortable: true,filter: true },
       // { headerName: 'Assembly/Component', field: 'type', editable: false, sortable: true,  minWidth: 180,filter: true},  
        { headerName: 'Item', field: 'itemNumber', maxWidth: 100, editable: false, sortable: true, minWidth: 100 ,filter: true },  
        { headerName: 'Sub-Item', field: 'subItemNumber',  editable: true, sortable: true , maxWidth: 100 ,filter: true}, 
        { headerName: 'Assembly Type', field: 'assemblyName', editable: true, sortable: true, minWidth: 130 ,filter: true},  
        { headerName: 'Component Type', field: 'componentTypeName', valueGetter: 'componentType', minWidth: 150,  filter: true,sortable: true},  
        { headerName: 'Description', field: 'materialDescription', minWidth: 150, editable: false, sortable: true,filter: true }, 
        { headerName: 'Design Notes', field: 'designNotes', minWidth: 150, editable: false, sortable: true, filter: true },  
        { headerName: 'MM / MMR', field: 'materialNumber', editable: false, sortable: true, minWidth: 130,filter: true},  
        { headerName: 'Supplier Part', field: 'supplierPartNumber',  minWidth: 130, editable: false, sortable: true ,filter: true},  
        { headerName: 'Legacy Ref', field: 'legacyRefNumber',  minWidth: 130, editable: true, sortable: true ,filter: true}, 
        { headerName: 'Length', field: 'assemblyLengthinft', maxWidth: 100,filter: true  },
        { headerName: 'Supplier', field: 'supplier', maxWidth: 180, editable: false, sortable: true ,filter: true},
        { headerName: 'Actual O.D.', field: 'actualOD1', editable: false, sortable: true, minWidth: 130, filter: true,
        valueGetter: (params: any) => `${params.data.actualOD1 || ''} ${params.data.actualOD2 ? 'X ' + params.data.actualOD2 : ''} ${params.data.actualOD3 ? 'X ' + params.data.actualOD3 : ''}`
      }, 
        { headerName: 'Actual I.D.', field: 'actualID1', minWidth: 130, editable: false, sortable: true ,filter: true,
          valueGetter: (params: any) => `${params.data.actualID1 || ''} ${params.data.actualID2 ? 'X ' + params.data.actualID2 : ''} ${params.data.actualID3 ? 'X ' + params.data.actualID3 : ''}`
        }, 
        { headerName: 'Top Depth (MD) - Inner String', field: 'topDepthInner', minWidth: 220, editable: false, sortable: true },
        { headerName: 'Top Depth (MD) - Outer String', field: 'topDepthOuter',  minWidth: 230,editable: false, sortable: true }, 
      ];

       perforationTableColumnDefs = [
        { headerName: 'Zone', field: 'zoneID', minWidth: 80, maxWidth: 100, filter: false, sortable: true, editable: false, },
        { headerName: 'Description', field: 'perforationDescription', minWidth: 250, maxWidth: 350, editable: false, sortable: true, filter: false },
        { headerName: 'Depth (MD)', field: 'perforationDepth', editable: true, sortable: true, minWidth: 180, maxWidth: 200, filter: true },
        { headerName: 'Zone Length (MD)', field: 'lengthOfPZone', editable: true, sortable: true, minWidth: 180, maxWidth: 200, filter: true },
        { headerName: 'Perf to Perf Length', field: 'perfToPerfLength', editable: true, sortable: true, minWidth: 180, maxWidth: 200, filter: true },
        { headerName: 'Screen Coverage', field: 'screenCoverage', editable: true, sortable: true, minWidth: 150, maxWidth: 180, filter: true },
      ];

      depthTableColumnDefs = [
        { headerName: 'Item #', field: 'itemNumber', minWidth: 80, maxWidth: 100, filter: false, sortable: true, editable: false, },
        { headerName: 'Sub-Item #', field: 'subItemNumber', minWidth: 250, maxWidth: 350, editable: false, sortable: true, filter: false },
        { headerName: 'Top Depth (MD) - Inner String', field: 'topDepthInner', editable: true, sortable: true, minWidth: 180, maxWidth: 200, filter: true },
        { headerName: 'Top Depth (MD) - Outer String', field: 'topDepthOuter', editable: true, sortable: true, minWidth: 180, maxWidth: 200, filter: true },
       
      ];
}