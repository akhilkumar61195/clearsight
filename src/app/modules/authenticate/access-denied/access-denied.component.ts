import { Component, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { PRIME_IMPORTS } from "../../../shared/prime-imports";

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss']
})

export class AccessDeniedComponent implements OnInit {
  @ViewChild('accessDeniedDialog') accessDeniedDialog: TemplateRef<any>;
  constructor(
    private router: Router) { }

  ngOnInit() {

  }
  ngAfterViewInit() {
  }

  onDismiss(): void {
    this.router.navigate(["/"]);
  }
}
