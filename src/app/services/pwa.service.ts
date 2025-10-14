import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Injectable()
export class PwaService {
  currentVersion: any;
  available: any;

  constructor(@Inject(DOCUMENT) readonly document: Document,
    public updates: SwUpdate) {
    if (updates.isEnabled) {
      updates.activateUpdate().then((resp:any) => {
        // this.currentVersion = event.current;
        // this.available = event.available;
        // console.log('current version is', event.current);
        // console.log('available version is', event.available);
        this.promptUser();
      });
      
      updates.versionUpdates.subscribe(evt => {
        switch (evt.type) {
          case 'VERSION_DETECTED':
            // console.log(`Downloading new app version: ${evt.version.hash}`);
            break;
          case 'VERSION_READY':
            // console.log(`Current app version: ${evt.currentVersion.hash}`);
            // console.log(`New app version ready for use: ${evt.latestVersion.hash}`);
            break;
          case 'VERSION_INSTALLATION_FAILED':
            // console.log(`Failed to install app version '${evt.version.hash}': ${evt.error}`);
            break;
        }
      });
    }
  }

  updateApp() {
    document.location.reload();
  }

  public checkForUpdates(): void {
    this.updates.versionUpdates.subscribe(event => this.promptUser());
  }

  private promptUser(): void {
    this.updates.activateUpdate().then(() => {
      localStorage.clear();
      this.deleteAllCookies();
      window.sessionStorage.clear();
      window.location.reload();
    });
  }

  deleteAllCookies = async () => {
    var cookies = this.document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var eqPos = cookie.indexOf("=");
      var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      this.document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    const keys = await window.caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    localStorage.clear();
  }
}
