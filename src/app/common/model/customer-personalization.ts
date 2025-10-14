export interface CustomerPersonalization {
  id: number;
  module?: string;
  appState?: string;
  contextData?: string;
  dateCreated?: Date;  
  userIdCreatedBy?: number;
}
