import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestempComponentComponent } from './testemp-component.component';

describe('TestempComponentComponent', () => {
  let component: TestempComponentComponent;
  let fixture: ComponentFixture<TestempComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestempComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TestempComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
