export interface ResponseListResult<T> {
  StatusCode: number;
  Success: boolean;
  TotalRecords: number;
  Message: string | null;
  Data: T | null;
}
