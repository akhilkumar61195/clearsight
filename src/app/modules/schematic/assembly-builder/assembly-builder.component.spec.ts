import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssemblyBuilderComponent } from './assembly-builder.component';

describe('AssemblyBuilderComponent', () => {
  let component: AssemblyBuilderComponent;
  let fixture: ComponentFixture<AssemblyBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssemblyBuilderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssemblyBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
