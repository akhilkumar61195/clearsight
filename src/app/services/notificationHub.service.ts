import { Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import * as signalR from '@microsoft/signalr';
import { ChatMessage, JoinRoomRequest, HubMethodResult, ConnectionStartResult, ChatAttachment } from '../common/model/chat.types';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { DocumentInfo } from '../common/model/Document/DocumentInfo';
import { NotificationModel } from '../common/model/NotificationModel';

/**
 * @module NotificationHubService
 * @description This module provides a service for managing real-time notification communication using SignalR.
 * It includes methods for establishing a connection to the SignalR hub and sending messages.
 */
@Injectable({
  providedIn: 'root'
})

/**
 * Service for managing real-time chat communication using SignalR.
 * @class NotificationHubService
 * @description Handles SignalR hub connection and message sending functionality for chat features.
 */
export class NotificationHubService {  /**
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
  API_ENDPOINT = environment.APIEndpoint + '/notificationHub';
 
  private notificationSubject = new BehaviorSubject<string>(null);

  notification$ = this.notificationSubject.asObservable();
  /**
 * Initializes a new instance of the ChatService.
 * Sets up the SignalR hub connection with logging configuration and starts the connection.
 * @constructor
 */  constructor(private http: HttpClient) {
    // Initialize the SignalR hub connection
    this.buildConnection();
    this.addNotificationListener();
    // Start the connection
    this.startConnection();    
    this.hubConnection.on('ReceiveNotification', (message: string) => {
      this.notificationSubject.next(message);
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
   * it will listen the notification and instant pass to component and hub
   */
    private addNotificationListener() {
    
    this.hubConnection.on('ReceiveNotification', (message: string) => {
      this.notificationSubject.next(message);
    });
  }
/**
 * Sends a notification message to the SignalR notification hub.
 * @param message - The message to send
 */
  public sendNotification(notificationModel: NotificationModel): Promise<void> {
    
    return this.hubConnection.invoke('SendNotification', notificationModel);
  }

}
