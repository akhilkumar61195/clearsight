/// <reference types="jasmine" />


import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateKitComponent } from './create-kit.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { WellheadkitstoreService } from '../../odinv3/wellhead/builder/wellheadkitbuilder.service';
import { AuthService } from '../../../services/auth.service';
import { of } from 'rxjs';

fdescribe('CreateKitComponent', () => {
    let component: CreateKitComponent;
    let fixture: ComponentFixture<CreateKitComponent>;
    let mockStoreService: jasmine.SpyObj<WellheadkitstoreService>;
    let mockAuthService: jasmine.SpyObj<AuthService>;

    beforeEach(async () => {
        // Create mock services
        mockStoreService = jasmine.createSpyObj('WellheadkitstoreService', ['createKit']);
        mockAuthService = jasmine.createSpyObj('AuthService', ['getUserDetail']);

        // Provide mock return value for userDetail
        mockAuthService.getUserDetail.and.returnValue({ uid: 123 });

        await TestBed.configureTestingModule({
            declarations: [CreateKitComponent],
            imports: [ReactiveFormsModule, FormsModule],
            providers: [
                { provide: WellheadkitstoreService, useValue: mockStoreService },
                { provide: AuthService, useValue: mockAuthService }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA] // Ignore unknown elements like <app-custom-dialog>
        }).compileComponents();

        fixture = TestBed.createComponent(CreateKitComponent);
        component = fixture.componentInstance;
        fixture.detectChanges(); // triggers ngOnInit
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize the form with empty kitName', () => {
        expect(component.kitForm).toBeDefined();
        expect(component.kitForm.get('kitName')?.value).toBe('');
    });

    it('should not call createKit() if the form is invalid', () => {
        spyOn(component, 'closeDialog');

        // Ensure the form is invalid
        component.kitForm.get('kitName')?.setValue('');

        component.handleCreate();

        expect(mockStoreService.createKit).not.toHaveBeenCalled();
        expect(component.closeDialog).not.toHaveBeenCalled();
    });

    it('should call createKit() if the form is valid', () => {
        const testName = 'Valid Kit Name';
        component.kitForm.get('kitName')?.setValue(testName);

        spyOn(component, 'closeDialog');

        component.handleCreate();

        expect(mockStoreService.createKit).toHaveBeenCalledWith({
            id: 0,
            kitType: testName,
            userId: 123,
            isDeleted: 0,
        });

        expect(component.closeDialog).toHaveBeenCalled();
    });

    it('should emit onClose and set visible to false on closeDialog()', () => {
        spyOn(component.onClose, 'emit');
        component.visible = true;

        component.closeDialog();

        expect(component.visible).toBeFalse();
        expect(component.onClose.emit).toHaveBeenCalled();
    });

    it('should call createKit() with correct payload on handleCreate()', () => {
        const testName = 'Test Kit';
        component.kitForm.get('kitName')?.setValue(testName);

        spyOn(component, 'closeDialog');

        component.handleCreate();

        expect(mockStoreService.createKit).toHaveBeenCalledWith({
            id: 0,
            kitType: testName,
            userId: 123,
            isDeleted: 0,
        });

        expect(component.closeDialog).toHaveBeenCalled();
    });
});
