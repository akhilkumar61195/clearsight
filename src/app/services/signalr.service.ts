import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;

  public startConnection(): void {
    // Create a new SignalR Hub connection with the specified URL
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/chatHub') // Update with your backend hub URL
      .build();
  
    // Start the SignalR connection and log the status
    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR Connection Error: ', err));
  }
  
  public sendMessage(user: string, message: string): void {
    // Invoke the SendMessage method on the hub with user and message
    this.hubConnection.invoke('SendMessage', user, message)
      .catch(err => console.error(err));
  }
  
  public onMessageReceived(callback: (user: string, message: string) => void): void {
    // Register a callback to handle messages received from the hub
    this.hubConnection.on('ReceiveMessage', callback);
  }  
}
