import { Component, OnInit } from '@angular/core';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../common/model/employee';
import { ScrollingModule } from '@angular/cdk/scrolling';


@Component({
  selector: 'app-testemp-component',
  templateUrl: './testemp-component.component.html',
  styleUrl: './testemp-component.component.scss'
})
export class TestempComponentComponent implements OnInit {
  employees: Employee[] = [];
  constructor(private employeeService: EmployeeService) { }
  ngOnInit(): void {
    this.employees = this.employeeService.getEmployees();
  }
}
