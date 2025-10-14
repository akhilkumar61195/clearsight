import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: { label: string; url: string }[] = [];
  currentPage: any;
  excludedIntialBreadCrumb = ["demandconsumption", "rawdata"]

  constructor(private router: Router, public activatedRoute: ActivatedRoute) {
    router.events.subscribe((val: any) => {
      if (val.url) {
        this.currentPage = val.url.split('/')[1];
      } else {
        if (val.snapshot) this.currentPage = val.snapshot.url[0]?.path;
        if (val.routerEvent?.url) this.currentPage = val.routerEvent?.url.replace('/', '');
      }
      this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
      this.saveBreadcrumbs();
    });
  }

  ngOnInit(): void {
    this.restoreBreadcrumbs();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
        this.saveBreadcrumbs();
      });
  }

private createBreadcrumbs(
  route: ActivatedRoute,
  url: string = '',
  breadcrumbs: { label: string; url: string }[] = []
): { label: string; url: string }[] {
  const children: ActivatedRoute[] = route.children;

  if (children.length === 0) {
    return breadcrumbs;
  }

  for (const child of children) {
    const routeURL: string = child.snapshot.url.map(seg => seg.path).join('/');
    if (routeURL) {
      url += `/${routeURL}`;
    }

    const label = child.snapshot.data['breadcrumb'];
    if (label) {
      breadcrumbs.push({
        label,
        url: '/' + url.replace(/^\/+/, ''), // ensure absolute path
      });
    }

    // ✅ keep recursing, don’t return here
    this.createBreadcrumbs(child, url, breadcrumbs);
  }

  return breadcrumbs;
}



  private saveBreadcrumbs(): void {
    localStorage.setItem('breadcrumbs', JSON.stringify(this.breadcrumbs));
  }

  private restoreBreadcrumbs(): void {
    const savedBreadcrumbs = localStorage.getItem('breadcrumbs');
    if (savedBreadcrumbs) {
      this.breadcrumbs = JSON.parse(savedBreadcrumbs);
    }
  }
}
