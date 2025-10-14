import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploadWithButtonComponent } from './file-upload-interactive-dialog.component';

describe('FileUploadWithButtonComponent', () => {
  let component: FileUploadWithButtonComponent;
  let fixture: ComponentFixture<FileUploadWithButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileUploadWithButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileUploadWithButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
