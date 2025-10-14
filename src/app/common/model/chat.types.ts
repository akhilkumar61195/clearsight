import { DocumentInfo } from '../../common/model/Document/DocumentInfo';
/**
 * Chat module type definitions
 * Contains interfaces and types used across the chat functionality
 */

/**
 * Represents a file attachment in a chat message
 */
export interface ChatAttachment {
  id?: string;
  fileName: string;
  filePath?: string; // Optional path if the file is stored on the server
  fileSize: number;
  fileType: string;
  fileContent?: string; // Base64 encoded content
  uploadProgress?: number;
  isUploading?: boolean;
  uploadError?: string;
}

/**
 * Represents a chat message in the system
 */
export interface ChatMessage {
  user: string;
  message: string;
  messageTime: string;
  isSystem?: boolean;
  attachments?: DocumentInfo[];
  hasAttachments?: boolean;
}

/**
 * Represents user detail information
 */
export interface UserDetail {
  uid: string | number;
  fullName: string;
  email?: string;
  role?: string;
  department?: string;
  [key: string]: unknown; // Allow for additional properties that might exist
}

/**
 * Represents the state of a chat room
 */
export interface ChatState {
  isConnected: boolean;
  isJoined: boolean;
  isConnecting: boolean;
  messageCount: number;
  userCount: number;
  unreadCount: number;
  roomName: string;
  user: string;
}

/**
 * Represents a room join request
 */
export interface JoinRoomRequest {
  roomId?: number;
  roomName?: string;
  userId: number;
  groupType: string;
}

/**
 * Represents the response from SignalR hub operations
 */
export interface HubOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Represents connection information
 */
export interface ConnectionInfo {
  connectionId: string;
  timestamp: Date;
  userId?: string;
}

/**
 * Generic type for SignalR hub method responses
 */
export type HubMethodResult<T = void> = Promise<T>;

/**
 * Represents the response from attachment upload operations
 */
export interface AttachmentUploadResult {
  success: boolean;
  attachmentId?: string;
  fileContent?: string; // Base64 encoded content
  message?: string;
  error?: string;
}

/**
 * Represents a file upload request for chat attachments
 */
export interface ChatFileUploadRequest {
  file: File;
  userId: string | number;
  roomName: string;
  messageId?: string;
}

/**
 * Type for SignalR connection start result
 */
export type ConnectionStartResult = HubMethodResult<void>;

export enum GroupType {
  OneToOne = 'One-to-One',
  ModuleGroup = 'Module Group',
  PrivateGroup = 'Private Group',
  AIChat = 'AI Chat',
}

/**
 * Represents a chat room in the system
 */
export interface ChatRoom{
    id?:number;
    name:string;
    senderId?:number;
    recipientId?:number;
    groupType:string;
    userIdCreatedBy?:number;
}

/**
 * Represents a user in the chat system
 */
export interface ChatUser {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  personaName: number;
  organizationID: number;
}

/**
 * Represents a user who has been contacted in the chat system
 */
export interface ContactedUser {
  userId: number;
  name?: string;
  roomId?: number;
  groupType?: string;
}

/**
 * Represents a search result item in the chat system
 */
export interface ChatSearchResult{
  content? :string;
  createdAt?:string;
  groupType?:string;
  itemId?:number;
  itemType?:string;
  roomId?:number;
  roomName?:string;
}