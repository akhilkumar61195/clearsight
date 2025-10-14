import { ChangeDetectorRef, Component } from '@angular/core';
import moment from 'moment';
import { fadeAnimation } from '../../../common/animations';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-layout-content',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.scss'],
    animations: [fadeAnimation]
})
export class ContentComponent {
    public version = 1.0;
    public currentYear: string = moment().format('YYYY');

    constructor(
        private changeDetector: ChangeDetectorRef
    ) { }

    ngAfterViewChecked() {
        this.changeDetector.detectChanges();
    }
}
