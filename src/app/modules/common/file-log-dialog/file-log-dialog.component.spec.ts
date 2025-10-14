import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileStatusDialogComponent } from './file-log-dialog.component';

describe('FileStatusDialogComponent', () => {
  let component: FileStatusDialogComponent;
  let fixture: ComponentFixture<FileStatusDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileStatusDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileStatusDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
