import { Injectable, signal, WritableSignal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Response } from '../../../common/model/response';
import { WellheadKits } from '../../../common/model/wellhead-kits';
import { WellheadkitService } from '../../../services/wellheadkit.service';

/**
 * Wellhead kit store service, responsible for managing wellhead kit data.
 */

@Injectable({
  providedIn: 'root'
})
export class EditWellHeadstoreService {

  // Signal storage for wellhead kits and components
  // kits: WritableSignal<WellheadKits[]> = signal<WellheadKits[]>([]);
  private readonly _kits = signal<WellheadKits[]>([]); // ✅ initialize with empty array
  readonly kits = this._kits.asReadonly();

  constructor(private api: WellheadkitService , private messageService:MessageService) { }

  /****************************Kits[Start]*********************************************/

  // Loads wellhead kits from the API and updates the kits signal.
  loadKits(): void {

    this.api.getKits().subscribe({

      next: (res: Response<WellheadKits[]>) => {

        //var data = res.result;
        //this.kits.update(() => [...data]);

        const data = res.result ?? []; // fallback safety
        // this.kits.update(() => [...data]);
        this._kits.set([...data]);

        //console.log('store service- loadWellheadKits', this.kits());

      },
      error: (err) => {
        console.error('Error fetching wellhead kit components', err);
        // this.kits.update(() => []);
        this._kits.set([]); // fallback to empty array on error
      }

    });

  }
}