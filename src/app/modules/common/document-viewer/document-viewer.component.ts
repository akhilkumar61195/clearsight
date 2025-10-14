import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MasterService } from '../../../services';
import { MasterObjectKeys } from '../../../common/enum/master-object-keys';
import { environment } from '../../../../environments/environment';
import { DomSanitizer } from '@angular/platform-browser';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'document-viewer',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss'
})
export class DocumentViewerComponent {

  @Input() documentId: number;

  @Output() onClose = new EventEmitter<void>();

  title: string = 'Loading...';

  visible: boolean = true;

  documentUrl;

  constructor(private masterService: MasterService, protected sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.documentUrl = `${environment.APIEndpoint}/Document/GetDocumentDetails?DocumentId=${this.documentId}`;

    this.getDocumentDetails();
    // this.getDocumentUrl();
  }

  onHide() {
    this.onClose.emit();
  }

  getDocumentDetails() {
    let body = {
      'DocumentId': this.documentId
    };
    this.masterService.getDetails(MasterObjectKeys.GetDocumentDetails, body).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.title = response.data.shortDescription
        }
      },
      error: (error) => {
      }
    });
  }

  getDocumentUrl() {
    this.documentUrl = this.sanitizer.bypassSecurityTrustUrl(`${environment.APIEndpoint}/Document/GetDocumentDetails?DocumentId=${this.documentId}`);
  }

}