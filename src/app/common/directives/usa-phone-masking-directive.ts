import { Directive, HostListener } from '@angular/core';
import { NgControl, Validators } from '@angular/forms';
import { getPhoneNumberInUSA } from '../constant';

@Directive({
    selector: '[appUSAPhoneMask]',
})
export class USAPhoneMaskingDirective {

    constructor(public ngControl: NgControl) { }

    @HostListener('input', ['$event'])
    onModelChange(input) {
        const value = input.target.value;
        this.onInputChange(value, false, input);
    }

    @HostListener('keydown.backspace', ['$event'])
    keydownBackspace(event) {
        this.onInputChange(event.target.value, true, event);
    }

    onInputChange(event, backspace, input) {
        let newVal = event.replace(/\D/g, '');

        if (newVal) {
            newVal = newVal.trim();
        }

        if (backspace && newVal.length <= 6) {
            newVal = newVal.substring(0, newVal.length - 1);
        }

        newVal = getPhoneNumberInUSA(newVal);
        if (newVal) {
            input.target.value = newVal;
        } else {
            input.target.value = null;
        }
    }
}
