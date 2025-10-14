export interface ConfigurationValues {
  id: number;
  configName: string;
  value: string;
  buId?: number;
  userIdCreatedBy?: string;   //Insert
  userIdModifiedBy?: string;  //Update
}

export interface listBuilder {
  id: number
  functionId: number
  configTable: string
  configName: string
  configText: string
  orderId: number
  columnDefs: ColumnDef[]
  agApi?: any,
  data?: innerData[]
}

export interface ColumnDef {
  headerName: string
  field: string
  editable: boolean
  sortable: boolean
  filter: boolean
  checkboxSelection: boolean
}
export interface innerData {
  id: number
  configName: string
  value: string
  dateCreated: string
  isDeleted: number
}

export interface configType {
  configName: string;
  configTable: string;
  configText: string;
  functionId: number;
  id: number;
  orderId: number;
}

export interface addUpdateDeleteData {
  configName: string;
  configTable: string;
  configText: string;
  functionId: number;
  id: number;
  orderId: number;
}
