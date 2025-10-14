import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSchematicComponent } from './edit-schematic.component';

describe('EditSchematicComponent', () => {
  let component: EditSchematicComponent;
  let fixture: ComponentFixture<EditSchematicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditSchematicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditSchematicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
