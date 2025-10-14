// format-number.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatNumber'
})
export class FormatNumberMask implements PipeTransform {

  transform(value: number | string, caseType: number): string {
    if (value === null || value === undefined || value === '') {
      return ''; // Return empty string if no value
    }

    let numStr = value.toString();

    // If the value already has a decimal point, remove it first (just in case)
    if (numStr.indexOf('.') !== -1) {
      numStr = numStr.replace('.', '');  // Remove the existing decimal point if any
    }

    // Format according to caseType
    if (caseType === 1 && numStr.length >2) {
      return numStr.slice(0, 2) + '.' + numStr.slice(2, 6);
    } else if (caseType === 2  && numStr.length >3) {
      return numStr.slice(0, 3) + '.' + numStr.slice(3, 6);
    } else if (caseType === 3 && numStr.length >2) {
      return numStr.slice(0, 1) + '.' + numStr.slice(1);
    } else if (caseType === 4) {
      return numStr.slice(0, 3);
    } else if (caseType === 5 && numStr.length >3) {
      return numStr.slice(0, 3) + ',' + numStr.slice(3);
    } else {
     
        return  numStr;
      
    }
}

}
