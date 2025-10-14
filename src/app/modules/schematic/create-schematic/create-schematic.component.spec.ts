import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSchematicComponent } from './create-schematic.component';

describe('CreateSchematicComponent', () => {
  let component: CreateSchematicComponent;
  let fixture: ComponentFixture<CreateSchematicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateSchematicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateSchematicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
