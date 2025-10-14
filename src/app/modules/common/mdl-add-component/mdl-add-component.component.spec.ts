import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MdlAddComponentComponent } from './mdl-add-component.component';

describe('MdlAddComponentComponent', () => {
  let component: MdlAddComponentComponent;
  let fixture: ComponentFixture<MdlAddComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MdlAddComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MdlAddComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
