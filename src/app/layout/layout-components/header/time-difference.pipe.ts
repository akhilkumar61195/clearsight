import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeDifference',
  standalone: true
})
export class TimeDifferencePipe implements PipeTransform {
  transform(value: any): string {
    return this.getRecentTimeDifference(value);
  }

  getRecentTimeDifference(timestamp: string): string {
    if(!timestamp)
      return '';

    const now = new Date();
    const targetTime = new Date(timestamp);
    const diffInMilliseconds = now.getTime() - targetTime.getTime();
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return `Just now`;
    }
  }
}
