import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MdlCompletionComponent } from './mdl-completion.component';

describe('MdlCompletionComponent', () => {
  let component: MdlCompletionComponent;
  let fixture: ComponentFixture<MdlCompletionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MdlCompletionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MdlCompletionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
