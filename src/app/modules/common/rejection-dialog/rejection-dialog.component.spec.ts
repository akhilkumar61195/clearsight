import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RejectSchematicComponent } from './rejection-dialog.component';

describe('RejectSchematicComponent', () => {
  let component: RejectSchematicComponent;
  let fixture: ComponentFixture<RejectSchematicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RejectSchematicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RejectSchematicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
