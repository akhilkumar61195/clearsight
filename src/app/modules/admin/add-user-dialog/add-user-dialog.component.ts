import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { ConfigurationValues } from '../../../common/model/configuration-values';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './add-user-dialog.component.html',
  styleUrls: ['./add-user-dialog.component.scss']
})
export class AddUserDialogComponent implements OnInit, OnDestroy{
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() userChange = new EventEmitter<any>();
  private adminSubscribe: Subscription = new Subscription();

  addUserForm: FormGroup;
  roleList: Array<ConfigurationValues> = [];

  constructor(private fb: FormBuilder,private configurationValuesService: ConfigurationValuesService) {}

  ngOnInit(): void {
    this.getRoleList();
    this.addUserForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      primaryRole: ['', Validators.required]
    });
    this.addUserForm.valueChanges.subscribe(val => {
      this.userChange.emit(val);
    });
  }

  /**
   * Fetches the list of Roles from the configuration values service.
   */
  getRoleList() {
    this.adminSubscribe = this.configurationValuesService.getAllEntities('configvalue', 'PrimaryRole').subscribe({
      next: (response) => {
        this.roleList = response;
      },
      error: (error) => {
      }
    });
  }

  onHide() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  ngOnDestroy(): void {
    this.adminSubscribe.unsubscribe();
  }
}
