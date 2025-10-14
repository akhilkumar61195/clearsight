import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WellFeaturesDialogComponent } from './well-features-dialog.component';

describe('WellFeaturesDialogComponent', () => {
  let component: WellFeaturesDialogComponent;
  let fixture: ComponentFixture<WellFeaturesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WellFeaturesDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WellFeaturesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
