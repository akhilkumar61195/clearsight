import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WellHeadersDialogComponent } from './well-headers.component';

describe('WellHeadersDialogComponent', () => {
  let component: WellHeadersDialogComponent;
  let fixture: ComponentFixture<WellHeadersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WellHeadersDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WellHeadersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
