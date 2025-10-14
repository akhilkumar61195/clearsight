import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinWhatIfCompletionsComponent } from './odin-what-if-completions.component';

describe('OdinWhatIfCompletionsComponent', () => {
  let component: OdinWhatIfCompletionsComponent;
  let fixture: ComponentFixture<OdinWhatIfCompletionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinWhatIfCompletionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinWhatIfCompletionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
