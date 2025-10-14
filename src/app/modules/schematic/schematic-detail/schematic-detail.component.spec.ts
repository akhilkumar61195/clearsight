import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicDetailComponent } from './schematic-detail.component';

describe('SchematicDetailComponent', () => {
  let component: SchematicDetailComponent;
  let fixture: ComponentFixture<SchematicDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SchematicDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SchematicDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
