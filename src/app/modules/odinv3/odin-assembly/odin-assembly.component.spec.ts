import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinAssembly3Component } from './odin-assembly.component';

describe('OdinAssembly3Component', () => {
  let component: OdinAssembly3Component;
  let fixture: ComponentFixture<OdinAssembly3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinAssembly3Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinAssembly3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
