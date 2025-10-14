import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MdlListEditorComponent } from './mdl-list-editor.component';

describe('MdlListEditorComponent', () => {
  let component: MdlListEditorComponent;
  let fixture: ComponentFixture<MdlListEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MdlListEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MdlListEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
