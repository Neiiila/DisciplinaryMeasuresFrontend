import type { Employee, EmployeeDto } from '@/features/employees/types'

/**
 * Data Mapper: translates between the PascalCase/underscore field names the
 * .NET backend returns (`first_Name`, `business_Unit`, `hiring_Date`, ...)
 * and the camelCase domain model the rest of the UI works with. Every
 * component, form and chart in this app can now assume one consistent
 * shape; only this file needs to change if the backend's wire format ever
 * changes.
 */
export function toEmployee(dto: EmployeeDto): Employee {
  return {
    id: dto.id,
    cin: dto.cin,
    gender: dto.gender,
    firstName: dto.first_Name,
    lastName: dto.last_Name,
    address: dto.address,
    phone: dto.tel,
    position: dto.position,
    site: dto.site,
    department: dto.department,
    businessUnit: dto.business_Unit,
    segment: dto.segment,
    localJobTitle: dto.local_Job_Title,
    hiringDate: dto.hiring_Date,
    email: dto.email,
    status: dto.status,
    supervisor: dto.supervisor,
    contractType: dto.contract_Type,
  }
}

export function toEmployeeDto(employee: Employee): Omit<EmployeeDto, 'photo'> {
  return {
    id: employee.id,
    cin: employee.cin,
    gender: employee.gender,
    first_Name: employee.firstName,
    last_Name: employee.lastName,
    address: employee.address,
    tel: employee.phone,
    position: employee.position,
    site: employee.site,
    department: employee.department,
    business_Unit: employee.businessUnit,
    segment: employee.segment,
    local_Job_Title: employee.localJobTitle,
    hiring_Date: employee.hiringDate,
    email: employee.email,
    status: employee.status,
    supervisor: employee.supervisor,
    contract_Type: employee.contractType,
  }
}
