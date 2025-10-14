import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AuthenticationSession, routeLinks } from '../../../common/enum/common-enum';
import { EMAILPATTERN } from '../../../common/constant';
import { AuthService } from '../../../services/auth.service';
import StorageService from '../../../services/storage.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  loading = false;
  submitted = false;
  EMAILPATTERN: string = EMAILPATTERN;
  errormessage: string = "";
  hide: boolean = true;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: AuthService,
    private messageService: MessageService,
    private commonService: CommonService
  ) {
    if (StorageService.getAccessToken()) {
      let userDetails=this.userService.getUserDetail();
      this.getLoggedInUserPermission(+userDetails.uid);
         
    }
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  onSubmit() {
    //clearing local storage before login
    localStorage.clear();
    const { value } = this.form;
    this.submitted = true;
    // stop here if form is invalid
    if (this.form.invalid) {
      return;
    }

    let body = { username: value.username, password: value.password };
    this.submitted = false;
    
    this.userService.login(body).subscribe({
      next: (resp: any) => {
       this.loading = false;
        const { message, data, success ,statusCode} = resp;
        if (success && statusCode==200) {
          StorageService.set(AuthenticationSession.TOKEN, data);
          let userDetails=this.userService.getUserDetail();
          
          this.getLoggedInUserPermission(+userDetails.uid);
          
        } else {
          this.errormessage = message;
        }
      },
      error: (error: any) => {
        this.loading = false;
      }
    });
  }

  showToast(title: string, message: string) {
    this.messageService.add({ severity: 'success', summary: title, detail: message });
  }

  unveilReveilPWD() {
    this.hide = !this.hide;
  }
  /**
   * getting logged in user application permissions
   * @param userId 
   */
   getLoggedInUserPermission(userId:number){
    
    this.userService.getUserPermissions(userId).subscribe({
      next: (resp: any) => {
        
        this.commonService.loggedInUserPermissionSignal.set(resp);
        StorageService.set(AuthenticationSession.LOGGEDINUSER_APPLICATION_PERSMISSION,JSON.stringify(resp)); // storing in localstorage
        this.loading = false;
        this.router.navigateByUrl(routeLinks.appSelector);
      },
      error: (error: any) => {
        this.loading = false;
      }
    });
  }
}