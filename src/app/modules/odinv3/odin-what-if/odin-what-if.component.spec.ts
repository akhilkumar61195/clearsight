import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinWhatIfComponent } from './odin-what-if.component';

describe('OdinWhatIfComponent', () => {
  let component: OdinWhatIfComponent;
  let fixture: ComponentFixture<OdinWhatIfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinWhatIfComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinWhatIfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
