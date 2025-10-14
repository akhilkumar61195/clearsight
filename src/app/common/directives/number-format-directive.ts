import { Directive, ElementRef, HostListener, AfterViewInit, OnChanges, SimpleChanges, ViewChild, AfterViewChecked } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

@Directive({
  selector: '[appNumberFormat]'
})
export class NumberFormatDirective implements  OnChanges,AfterViewChecked {
  
  constructor(private el: ElementRef) {}

  ngAfterViewChecked() {
    // Apply formatting on page load if the input has a value
    this.formatInput();
  }
    
  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
         this.formatInput();
    }
  }

  @HostListener('input', ['$event'])
  onInputChange(event: any) {
    this.formatInput();
  }

  formatInput() {
    const inputElement = this.el.nativeElement;
    let value = inputElement.value;
  
    if (value) {
      // Remove commas and spaces
      value = value.replace(/,/g, '').replace(/\s+/g, '');
  
      // Allow up to 5 digits before the decimal and up to 2 after the decimal
      const regex = /^(\d{0,5})(\.\d{0,2})?$/;
      const matches = value.match(regex);
  
      if (matches) {
        // Get the whole part and fractional part
        let wholePart = matches[1];
        let fractionalPart = matches[2] || '';
  
        // Format the whole part with commas
        wholePart = parseInt(wholePart, 10).toLocaleString();
  
        // Combine formatted whole part and fractional part (if any)
        inputElement.value = wholePart + fractionalPart;
      } else {
        // If input doesn't match, remove the last invalid character
        inputElement.value = inputElement.value.slice(0, -1);
      }
    }
  }
}
