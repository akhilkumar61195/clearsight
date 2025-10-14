import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchFileStatusDialogComponent } from './batch-file-status-dialog.component';

describe('BatchFileStatusDialogComponent', () => {
  let component: BatchFileStatusDialogComponent;
  let fixture: ComponentFixture<BatchFileStatusDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BatchFileStatusDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BatchFileStatusDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
