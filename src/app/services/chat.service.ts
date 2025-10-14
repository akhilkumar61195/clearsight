import { Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import * as signalR from '@microsoft/signalr';
import { ChatMessage, JoinRoomRequest, HubMethodResult, ConnectionStartResult, ChatAttachment, ChatRoom, ChatUser, ContactedUser } from '../common/model/chat.types';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { DocumentInfo } from '../common/model/Document/DocumentInfo';
import { NotificationHubService } from './notificationHub.service';
import { NotificationModel } from '../common/model/NotificationModel';
import { AuthService } from './auth.service';

/**
 * @module ChatService
 * @description This module provides a service for managing real-time chat communication using SignalR.
 * It includes methods for establishing a connection to the SignalR hub and sending messages.
 */
@Injectable({
  providedIn: 'root'
})

/**
 * Service for managing real-time chat communication using SignalR.
 * @class ChatService
 * @description Handles SignalR hub connection and message sending functionality for chat features.
 */
export class ChatService {  /**
* Creates a SignalR hub connection and initializes the connection.
* @private
* @property {signalR.HubConnection} hubConnection - The SignalR hub connection instance
*/
  private hubConnection: signalR.HubConnection;
  public connectionState: WritableSignal<signalR.HubConnectionState> = signal<signalR.HubConnectionState>(signalR.HubConnectionState.Disconnected);

  public messages: WritableSignal<ChatMessage[]> = signal<ChatMessage[]>([]);
  public connectedUsers: WritableSignal<string[]> = signal<string[]>([]);
  public isJoined: WritableSignal<boolean> = signal<boolean>(false);
  public messagesList: ChatMessage[] = [];
  public users: string[] = [];
  API_ENDPOINT = `${environment.APIEndpoint}/chatHub`;

  private notificationSubject = new BehaviorSubject<string>(null);

  notification$ = this.notificationSubject.asObservable();
  /**
 * Initializes a new instance of the ChatService.
 * Sets up the SignalR hub connection with logging configuration and starts the connection.
 * @constructor
 */  constructor(private http: HttpClient, private notificationHubService: NotificationHubService, private authService: AuthService) {
    // Initialize the SignalR hub connection
    this.buildConnection();
    //this.addNotificationListener();
    // Start the connection
    this.startConnection();
    // Set up event listeners for incoming messages and connected users
    this.hubConnection.on("ReceiveMessage", (user: string, message: string, messageTime: string) => {
      const chatMessage = this.normalizeMessage({ user, message, messageTime });
      this.messagesList = [...this.messagesList, chatMessage];
      this.messages.set(this.messagesList);
    });


    this.hubConnection.on('ReceiveHistory', (messages: ChatMessage[]) => {
      this.messagesList = messages.map(msg => this.normalizeMessage(msg));
      this.messages.set(this.messagesList);
    });

    // Set up event listener for messages with attachments
    this.hubConnection.on("ReceiveMessageWithAttachment", (user: string, message: string, attachmentName: string, messageTime: string) => {
      const attachment: DocumentInfo = {
        shortDescription: attachmentName,
        contentType: this.getFileTypeFromName(attachmentName),
        url: attachmentName // Assuming the URL is the same as the name for simplicity
      };

      const chatMessage = this.normalizeMessage({
        user,
        message,
        messageTime,
        attachments: [attachment],
        hasAttachments: true
      });

      this.messagesList = [...this.messagesList, chatMessage];
      this.messages.set(this.messagesList);
    });


    // Set up event listener for attachment only messages
    this.hubConnection.on("ReceiveAttachment", (user: string, attachmentName: string, messageTime: string) => {
      const attachment: DocumentInfo = {
        shortDescription: attachmentName,
        contentType: this.getFileTypeFromName(attachmentName),
        url: attachmentName // Assuming the URL is the same as the name for simplicity
      };

      const chatMessage = this.normalizeMessage({
        user,
        message: '', // No text message, just attachment
        messageTime,
        attachments: [attachment],
        hasAttachments: true
      });

      this.messagesList = [...this.messagesList, chatMessage];
      this.messages.set(this.messagesList);
    });

    // Listen for connected users
    this.hubConnection.on("ConnectedUser", (users: string[]) => {
      this.connectedUsers.set(users);
      this.isJoined.set(true);
    });
  }

  /**
* Builds the SignalR hub connection with automatic reconnection and logging.
* @private
*/
  private buildConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.API_ENDPOINT)
      .withAutomaticReconnect([0, 2000, 10000, 30000]) // Add automatic reconnection      
      .configureLogging(signalR.LogLevel.Information)
      .build();    // Handle connection events
    this.hubConnection.onclose((error) => {
      this.connectionState.set(signalR.HubConnectionState.Disconnected);
    });

    this.hubConnection.onreconnecting((error) => {
      this.connectionState.set(signalR.HubConnectionState.Reconnecting);
    });

    this.hubConnection.onreconnected((connectionId) => {
      this.connectionState.set(signalR.HubConnectionState.Connected);
    });
  }  /**
 * Establishes the SignalR connection to the chat hub.
 * @private
 * @method startConnection
 * @returns {ConnectionStartResult}
 */
  public startConnection(): ConnectionStartResult {
    return this.hubConnection.start().then(() => {
      this.connectionState.set(signalR.HubConnectionState.Connected);
    });
  }
  /**
   * Joins a specified room in the chat hub.
   * @public
   * @method joinRoom
   * @param {string} user - The user joining the room
   * @param {string} room - The room to join
   * @returns {HubMethodResult<void>}
   */
  public async joinRoom(userId: number, roomId: number, groupType: string, roomName: string): HubMethodResult<void> {
    const joinRequest: JoinRoomRequest = { userId: parseInt(userId.toString()), roomId: roomId, groupType: groupType, roomName: roomName };
    return this.hubConnection.invoke("JoinRoom", joinRequest);
  }

  /**
   * Joins a specified room in the chat hub.
   * @public
   * @method joinOneToOneRoom
   * @param {string} user - The user joining the room
   * @param {string} receiver - The user to connect with
   * @returns {HubMethodResult<void>}
   */
  public async joinOneToOneRoom(activeRoom: ChatRoom): HubMethodResult<void> {
    return this.hubConnection.invoke("JoinOneToOneRoom", parseInt(activeRoom.senderId.toString()), parseInt(activeRoom.recipientId.toString()), parseInt(activeRoom.id.toString()), activeRoom.groupType);
  }

  /**
   * Sends a message through the SignalR hub connection.
   * @public
   * @method sendMessage
   * @param {string} message - The message to be sent through the chat hub
   * @returns {HubMethodResult<void>}
   */
  public sendMessage(message: string, selectedUserId: number, roomId: number): HubMethodResult<void> {
    const userDetail = this.authService.getUserDetail();
    const notification: NotificationModel = {
      senderId: +userDetail.uid,
      receiverId: selectedUserId,
      notificationMessage: message,
      appFrom: 'Chat',
      appTo: 'Tyr',
      messageType: 'Info',
      userIdCreatedBy: +userDetail.uid
    };
    //this.notificationHubService.sendNotification(notification);
    return this.hubConnection.invoke('SendMessage', message, selectedUserId, roomId);
  }

  /**
   * Leaves the current chat room.
   * @public
   * @method leaveChat
   * @returns {Promise<void>}
   */
  public async leaveChat(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      const result = await this.hubConnection.stop();
      this.connectionState.set(signalR.HubConnectionState.Disconnected);
      return result;
    }
  }
  /**
 * Gets the current connection state of the SignalR hub.
 * @public
 * @property {signalR.HubConnectionState} hubConnectionState - The current state of the SignalR hub connection
 */
  public get hubConnectionState(): signalR.HubConnectionState {
    return this.hubConnection.state;
  }

  /**
   * Uploads an attachment file to the server and returns its URL and metadata
   * @param file - File to upload
   * @returns Promise<{ url: string, name: string, size: number, type: string }>
   */
  public uploadAttachment(file: File): Promise<{ url: string, name: string, size: number, type: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string, name: string, size: number, type: string }>(
      `${environment.APIEndpoint}/Chat/upload`, formData
    ).toPromise();
  }

  /**
   * Sends a message with attachments through the SignalR hub connection (using file URL)
   * @public
   * @method sendMessageWithAttachments
   * @param {string} message - The message to be sent
   * @param {string} attachmentName - The name of the attachment
   * @param {string} attachmentUrl - The URL of the uploaded attachment
   * @returns {HubMethodResult<void>}
   */
  public sendMessageWithAttachments(message: string, attachmentName: string, attachmentid: number, selectedUserId: number, roomId: number): HubMethodResult<void> {
    return this.hubConnection.invoke('SendMessageWithAttachment', message, attachmentName, attachmentid, selectedUserId, roomId);
  }

  /**
   * Sends an attachment only (no message) through the SignalR hub connection (using file URL)
   * @public
   * @method sendAttachment
   * @param {string} attachmentName - The name of the attachment
   * @param {string} attachmentUrl - The URL of the uploaded attachment
   * @returns {HubMethodResult<void>}
   */
  public sendAttachment(attachmentName: string, attachmentId: number, selectedUserId: number, roomId: number): HubMethodResult<void> {
    return this.hubConnection.invoke('SendAttachment', attachmentName, attachmentId, selectedUserId, roomId);
  }

  /**
   * Convert file to base64 string (deprecated for large files)
   * @deprecated Use uploadAttachment for large files
   */
  public convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64Content = result.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Calculate file size from base64 content
   * @param base64Content - Base64 encoded content
   * @returns number - File size in bytes
   */
  private calculateBase64Size(base64Content: string): number {
    return Math.round((base64Content.length * 3) / 4);
  }

  /**
   * Get file type from file name
   * @param fileName - Name of the file
   * @returns string - MIME type
   */
  private getFileTypeFromName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'csv': 'text/csv'
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Uploads an attachment file to the server and returns its URL and metadata
   * @param file - File to upload
   * @returns 
   */
  public downloadAttachment(attachment: ChatAttachment) {
    let filename = attachment.filePath.split('/').pop();
    if (!filename) {
      console.error('Failed to extract filename from filePath');
      return;
    }

    this.http.get(`${environment.APIEndpoint}/Chat/download/${filename}`, { responseType: 'blob' })
      .subscribe((response: Blob) => {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      });
  }

  /**
   * Downloads an attachment by opening the file URL in a new tab
   * @public
   * @method downloadAttachment
   * @param {ChatAttachment} attachment - The attachment to download
   */
  // public downloadAttachment(attachment: ChatAttachment): void {
  //   if (!attachment.fileContent) {
  //     console.error('No file content available for download');
  //     return;
  //   }
  //   // If fileContent is a URL, open it directly
  //   if (attachment.fileContent.startsWith('http')) {
  //     window.open(attachment.fileContent, '_blank');
  //     return;
  //   }
  //   // ...existing code for base64 fallback...
  //   try {
  //     const byteCharacters = atob(attachment.fileContent);
  //     const byteNumbers = new Array(byteCharacters.length);
  //     for (let i = 0; i < byteCharacters.length; i++) {
  //       byteNumbers[i] = byteCharacters.charCodeAt(i);
  //     }
  //     const byteArray = new Uint8Array(byteNumbers);
  //     const blob = new Blob([byteArray], { type: attachment.fileType });
  //     const url = window.URL.createObjectURL(blob);
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = attachment.fileName;
  //     link.click();
  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error('Failed to download attachment:', error);
  //   }
  // }

  public searchMessagesAndAttachments(query: string, userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.APIEndpoint}/Chat/search`, { params: { query, userId } });
  }

  /**
   * Fetches all contacted users for a specific user.
   * @param userId - ID of the user to fetch contacted users for
   * @returns Observable<ContactedUser[]> - An observable containing the list of contacted users
   */
  public getAllContactedUsers(userId: number): Observable<ContactedUser[]> {
    return this.http.get<ContactedUser[]>(`${environment.APIEndpoint}/Chat/contactedUsers/${userId}`);
  }

  /**
   * Sends a chat message to a specific user.
   * @param message - The message content
   * @param senderId - ID of the user sending the message
   * @param roomId - ID of the chat room
   * @returns Observable<any> - An observable of the HTTP response
   */
  public getAIResponse(message: string, senderId: number, roomId: number): Observable<string> {
    //send message in body as raw text type
    return this.http.get<string>(`${environment.APIEndpoint}/Chat/aichat`, { params: { query: message, senderId, roomId } });
  }

  /**
   * it will listen the notification and instant pass to component and hub
   */
  private addNotificationListener() {
    this.hubConnection.on('ReceiveNotification', (message: string) => {
      this.notificationSubject.next(message);
    });
  }

  /**
   * Fetches the user groups for the current user.
   * @param userId - The ID of the user
   * @returns {Observable<ChatRoom[]>} - An observable of the user's chat rooms
   */
  public getUserGroups(userId: number, moduleName: string): Observable<ChatRoom[]> {
    // Replace with actual API call or logic
    // Example using HttpClient:
    return this.http.get<ChatRoom[]>(`${environment.APIEndpoint}/Chat/usergroups/${userId}/${moduleName}`);
    //return of([]); // Placeholder: returns empty array
  }

  /**
   * For adding Members to User Group
   * @param userId 
   * @param roomName 
   * @param groupType 
   * @param userIds 
   * @returns 
   */
  public async addUsersToGroup(userId: number, roomId: number, groupType: string, userIds: number[], roomName: string): HubMethodResult<void> {
    const joinRequest: JoinRoomRequest = { userId: parseInt(userId.toString()), roomId: roomId, groupType: groupType, roomName: roomName };
    return this.hubConnection.invoke("AddUsersToGroup", joinRequest, userIds);
  }

  /**
   * Get Users By Group ID
   * @param groupId 
   * @returns 
   */
  public getUsersByGroupId(groupId: number): Observable<number[]> {
    return this.http.get<number[]>(`${environment.APIEndpoint}/Chat/getusersbygroupid/${groupId}`);
  }
  /**
   * Get user details by username
   * @param userName - The username to search for
   * @returns Observable<ChatUser>
   */
  public getUserByUserName(userName: string): Observable<ChatUser> {
    return this.http.get<ChatUser>(
      `${environment.APIEndpoint}/Chat/getuserbyusername/${encodeURIComponent(userName)}`
    );
  }

  /**
   * Normalizes a raw message from the backend.
   * @param msg - raw message from backend
   * @returns normalized ChatMessage with local time and filtered attachments
   */
  private normalizeMessage(msg: any): ChatMessage {
    // Backend gives "2025-09-05 10:41:07.3655487"
    const isoString = msg.messageTime.substring(0, 23).replace(" ", "T") + "Z";
    const localTime = new Date(isoString);

    return {
      ...msg,
      messageTime: localTime.toLocaleString(), // always local time
      attachments: msg.attachments?.filter(a => a !== null) || [],
      hasAttachments: (msg.attachments && msg.attachments.filter(a => a !== null).length > 0) || false
    };
  }

  /**
   * Deletes a chat group.
   * @param roomId - The ID of the room to delete
   * @returns An observable of the HTTP response
   */
  public deleteGroup(roomId: number): Observable<any> {
    return this.http.post(
      `${environment.APIEndpoint}/Chat/deletegroup/${roomId}`,
      {}
    );
  }

  /**
   * Removes users from a chat group.
   * @param roomId - The ID of the room
   * @param userIds - The IDs of the users to remove
   * @returns An observable of the updated chat user
   */
  public removeUsersFromGroup(roomId: number, userIds: number[]): Observable<ChatUser> {
    return this.http.post<ChatUser>(
      `${environment.APIEndpoint}/Chat/removeusersfromgroup/${roomId}`,
      userIds
    );
  }
}
