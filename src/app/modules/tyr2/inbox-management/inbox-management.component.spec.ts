import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboxManagementComponent } from './inbox-management.component';

describe('InboxManagementComponent', () => {
  let component: InboxManagementComponent;
  let fixture: ComponentFixture<InboxManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboxManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InboxManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
