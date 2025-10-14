import { Injectable } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {

  // Default height subject (used in observeBreakpoints())
  private heightSubject: BehaviorSubject<string> = new BehaviorSubject('100vh');

  constructor(private breakpointObserver: BreakpointObserver) {
    this.observeBreakpoints(); // Default behavior on init
  }

  // Default observer — this is the global fallback used automatically
  public observeBreakpoints(): void {
    this.breakpointObserver.observe([
      '(min-width: 2560px) and (max-width: 3840px)',
      '(min-width: 1440px) and (max-width: 2560px)',
      '(min-width: 1024px) and (max-width: 1440px)',
      '(min-width: 768px) and (max-width: 1024px)'
    ]).subscribe((result: BreakpointState) => {
      if (result.breakpoints['(min-width: 2560px) and (max-width: 3840px)']) {
        this.heightSubject.next('85vh');
      } else if (result.breakpoints['(min-width: 1440px) and (max-width: 2560px)']) {
        this.heightSubject.next('calc(100vh - 228px)');
      } else if (result.breakpoints['(min-width: 1024px) and (max-width: 1440px)']) {
        this.heightSubject.next('calc(100vh - 275px)');
      } else if (result.breakpoints['(min-width: 768px) and (max-width: 1024px)']) {
        this.heightSubject.next('76vh');
      } else {
        this.heightSubject.next('74vh');
      }
    });
  }

   public odinCompletionMediaQuerry(): void {
    this.breakpointObserver.observe([
      '(min-width: 2560px) and (max-width: 3840px)',
      '(min-width: 1440px) and (max-width: 2560px)',
      '(min-width: 1024px) and (max-width: 1440px)',
      '(min-width: 768px) and (max-width: 1024px)'
    ]).subscribe((result: BreakpointState) => {
      if (result.breakpoints['(min-width: 2560px) and (max-width: 3840px)']) {
        this.heightSubject.next('85vh');
      } else if (result.breakpoints['(min-width: 1440px) and (max-width: 2560px)']) {
        this.heightSubject.next('calc(100vh - 231px)');
      } else if (result.breakpoints['(min-width: 1024px) and (max-width: 1440px)']) {
        this.heightSubject.next('calc(100vh - 275px)');
      } else if (result.breakpoints['(min-width: 768px) and (max-width: 1024px)']) {
        this.heightSubject.next('76vh');
      } else {
        this.heightSubject.next('74vh');
      }
    });
  }

  //  rigMediaQueries: custom variant 2
  public rigMediaQueries(): void {
    this.breakpointObserver.observe([
      '(min-width: 2560px) and (max-width: 3840px)',
      '(min-width: 1440px) and (max-width: 2560px)',
      '(min-width: 1024px) and (max-width: 1440px)',
      '(min-width: 768px) and (max-width: 1024px)'
    ]).subscribe(result => {
      if (result.breakpoints['(min-width: 2560px) and (max-width: 3840px)']) {
        this.heightSubject.next('88vh');
      } else if (result.breakpoints['(min-width: 1440px) and (max-width: 2560px)']) {
        this.heightSubject.next('calc(100vh - 195px)');
      } else if (result.breakpoints['(min-width: 1024px) and (max-width: 1440px)']) {
        this.heightSubject.next('calc(100vh - 220px)');
      } else if (result.breakpoints['(min-width: 768px) and (max-width: 1024px)']) {
        this.heightSubject.next('76vh');
      } else {
        this.heightSubject.next('74vh');
      }
    });
  }

  //  thorMediaQueries: custom variant 2
  public thorMediaQueries(): void {
    this.breakpointObserver.observe([
      '(min-width: 2560px) and (max-width: 3840px)',
      '(min-width: 1440px) and (max-width: 2560px)',
      '(min-width: 1024px) and (max-width: 1440px)',
      '(min-width: 768px) and (max-width: 1024px)'
    ]).subscribe(result => {
      if (result.breakpoints['(min-width: 2560px) and (max-width: 3840px)']) {
        this.heightSubject.next('85vh');
      } else if (result.breakpoints['(min-width: 1440px) and (max-width: 2560px)']) {
        this.heightSubject.next('calc(100vh - 238px)');
      } else if (result.breakpoints['(min-width: 1024px) and (max-width: 1440px)']) {
        this.heightSubject.next('calc(100vh - 275px)');
      } else if (result.breakpoints['(min-width: 768px) and (max-width: 1024px)']) {
        this.heightSubject.next('76vh');
      } else {
        this.heightSubject.next('74vh');
      }
    });
  }

  //  Public getter for height as Observable
  public getHeight$(): Observable<string> {
    return this.heightSubject.asObservable();
  }
}
