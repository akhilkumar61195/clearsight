import { Injectable, signal } from '@angular/core';
import { Employee } from '../common/model/employee';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private employeesSignal = signal<Employee[]>([]);
  constructor(private http: HttpClient) { }

  fetchEmployees(): void {
    this.http.get<Employee[]>(environment.APIEndpoint + '/api/Employees')
      .subscribe(
        {
          next: (data) => { this.employeesSignal.set(data) },
          error: (error) => { console.error('Failed to fetch employees:', error); }
        }
      );
  }

  getEmployees(): Employee[] {
    return this.employeesSignal();
  }

  addEmployee(newEmployee: Employee): void {
    this.http.post<Employee>(environment.APIEndpoint + '/api/Employees', newEmployee)
      .subscribe(
        {
          next: (addedEmployee) => {
            const currentEmployees = this.employeesSignal();
            this.employeesSignal.set([...currentEmployees, addedEmployee]); // Update the signal
          },
          error: (error) => {
            console.error('Failed to add employee:', error);
          }
        }
      );
  }
}
