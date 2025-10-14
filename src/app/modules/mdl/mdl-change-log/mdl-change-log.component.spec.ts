import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MdlChangeLogComponent } from './mdl-change-log.component';

describe('MdlChangeLogComponent', () => {
  let component: MdlChangeLogComponent;
  let fixture: ComponentFixture<MdlChangeLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MdlChangeLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MdlChangeLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
