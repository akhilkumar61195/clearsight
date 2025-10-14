import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrillingListEditorComponent } from './drilling-list-editor.component';

describe('DrillingListEditorComponent', () => {
  let component: DrillingListEditorComponent;
  let fixture: ComponentFixture<DrillingListEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DrillingListEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrillingListEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
