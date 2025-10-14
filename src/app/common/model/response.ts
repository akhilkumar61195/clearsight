export interface Response<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  result?: T;
  errors?: any;
}

export interface PagedResponse<T> {
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  data?: T;
}
