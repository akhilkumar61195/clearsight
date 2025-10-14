import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProceedConfirmationDialogComponent } from './proceed-confirmation-dialog.component';

describe('ProceedConfirmationDialogComponent', () => {
  let component: ProceedConfirmationDialogComponent;
  let fixture: ComponentFixture<ProceedConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProceedConfirmationDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProceedConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
