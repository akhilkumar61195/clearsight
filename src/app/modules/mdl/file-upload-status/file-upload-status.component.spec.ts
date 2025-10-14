import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploadStatusComponent } from './file-upload-status.component';

describe('FileUploadStatusComponent', () => {
  let component: FileUploadStatusComponent;
  let fixture: ComponentFixture<FileUploadStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileUploadStatusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileUploadStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
