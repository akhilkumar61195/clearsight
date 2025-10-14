import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloneAssemblyComponent } from './clone-assembly.component';

describe('CloneAssemblyComponent', () => {
  let component: CloneAssemblyComponent;
  let fixture: ComponentFixture<CloneAssemblyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CloneAssemblyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloneAssemblyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
