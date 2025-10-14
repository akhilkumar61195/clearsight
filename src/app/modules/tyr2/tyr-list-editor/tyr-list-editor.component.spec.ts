import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TyrListEditorComponent } from './tyr-list-editor.component';

describe('TyrListEditorComponent', () => {
  let component: TyrListEditorComponent;
  let fixture: ComponentFixture<TyrListEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TyrListEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TyrListEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
