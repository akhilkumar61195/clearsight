import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDecimal'
})
export class FormatDecimalPipe implements PipeTransform {
  transform(value: any): string {
    // Attempt to parse the value as a float
    const num = parseFloat(value);

    // Check if the value is a valid number and is in scientific notation
    if (!isNaN(num) && value.toString().includes('e')) {
      return num.toFixed(2); // Format to 2 decimal places in scientific notation
    }

    return value; // Return value for non-scientific notation or invalid numbers
  }
}
