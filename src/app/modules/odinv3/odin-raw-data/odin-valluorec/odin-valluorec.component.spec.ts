import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinValluorecComponent } from './odin-valluorec.component';

describe('OdinValluorecComponent', () => {
  let component: OdinValluorecComponent;
  let fixture: ComponentFixture<OdinValluorecComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinValluorecComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinValluorecComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
