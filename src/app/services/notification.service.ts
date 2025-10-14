import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/internal/Observable";


@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  NOTIFICATIONAPI_ENDPOINT = environment.APIEndpoint + '/api/NotificationHub';
  constructor(private http: HttpClient) { }


  getNotifications(personaId: number,userId:number): Observable<Notification[]> {

    const url: string = `${this.NOTIFICATIONAPI_ENDPOINT}/getNotificationHub?personaId=${personaId}&userId=${userId}`;
    return this.http.get<any>(url);

  }
    dismissNotifications(transactionId: number,userId:number): Observable<boolean[]> {

    const url: string = `${this.NOTIFICATIONAPI_ENDPOINT}/dismissNotification?notificationTransactionId=${transactionId}&userId=${userId} `;
    return this.http.get<any>(url);

  }
}

