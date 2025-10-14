import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportToOdinDialogComponent } from './export-to-odin-dialog.component';

describe('ExportToOdinDialogComponent', () => {
  let component: ExportToOdinDialogComponent;
  let fixture: ComponentFixture<ExportToOdinDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExportToOdinDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExportToOdinDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
