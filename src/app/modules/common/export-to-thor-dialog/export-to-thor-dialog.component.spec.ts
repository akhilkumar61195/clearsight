import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportToThorDialogComponent } from './export-to-thor-dialog.component';

describe('ExportToThorDialogComponent', () => {
  let component: ExportToThorDialogComponent;
  let fixture: ComponentFixture<ExportToThorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExportToThorDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExportToThorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
