import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicLandingComponent } from './schematic-landing.component';

describe('SchematicLandingComponent', () => {
  let component: SchematicLandingComponent;
  let fixture: ComponentFixture<SchematicLandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SchematicLandingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SchematicLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
