import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportDepthTableDialogComponent } from './import-depth-table-dialog.component';

describe('ImportDepthTableDialogComponent', () => {
  let component: ImportDepthTableDialogComponent;
  let fixture: ComponentFixture<ImportDepthTableDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImportDepthTableDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImportDepthTableDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
