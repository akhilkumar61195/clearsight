import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinCompletionMitiComponent } from './odin-completion-miti.component';

describe('OdinCompletionMitiComponent', () => {
  let component: OdinCompletionMitiComponent;
  let fixture: ComponentFixture<OdinCompletionMitiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinCompletionMitiComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinCompletionMitiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
