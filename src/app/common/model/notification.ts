export class Notification {
  id: number;
  notificationMessage: string|null;
  appFrom?: string | null;
  appTo?: string | null;
  messageType?: string | null;
  
}

// Adding interface for notificationArray
export interface NotificationGroupArray {
  title: string;
  key: string;
}