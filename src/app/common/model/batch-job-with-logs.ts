export interface BatchJobWithLogs {
  batchJobId: number;
  fileName: string;
  fileHash: string;
  processStatus: string;
  transformationStatus: string;
  taskType: string;
  createdBy: string;
  createdDate: Date | null;
  batchFileLogs: BatchFileLog[];
}

export interface BatchFileLog {
  id: number;
  batchJobId: number;
  timestamp: Date | null;  
  logMessage: string | null; 
}
