export interface NotificationModel {
  
  senderId?: number;
  receiverId?: number;
  notificationMessage?: string;
  appFrom?: string;
  appTo?: string;
  messageType: string;
  userIdCreatedBy: number;
}