import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WellsDetailsInteractiveDialogComponent } from './Well-details-interactive-dialog.component';

describe('WellsDetailsInteractiveDialogComponent', () => {
  let component: WellsDetailsInteractiveDialogComponent;
  let fixture: ComponentFixture<WellsDetailsInteractiveDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WellsDetailsInteractiveDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WellsDetailsInteractiveDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
