import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveEmailComponent } from './move-email.component';

describe('MoveEmailComponent', () => {
  let component: MoveEmailComponent;
  let fixture: ComponentFixture<MoveEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoveEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
