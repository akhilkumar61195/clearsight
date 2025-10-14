import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { finalize, tap, map } from 'rxjs/operators';
import { toPascalCase } from '../common-methods';
import StorageService from '../../services/storage.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  // constructor(private _fuseProgressBarService: FuseProgressBarService) { }

  addToken(req: HttpRequest<any>, accessToken: string): HttpRequest<any> {
    if (accessToken) {
      const setHeaders = {
        Authorization: `Bearer ${accessToken}`,
        "X-Content-Type-Options": "nosniff"
      };
      return req.clone({ setHeaders });
    }
    return req;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // this._fuseProgressBarService.show();
    return next
      .handle(this.addToken(req, StorageService.getAccessToken()))
      .pipe(
        tap((event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            // this._fuseProgressBarService.hide();
          }
        }, (error) => {
          // this._fuseProgressBarService.hide();
        }),
        finalize(() => {
        })
      );
  }
}
