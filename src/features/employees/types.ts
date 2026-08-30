export interface Employee {
  id: string
  cin: string
  gender: string
  firstName: string
  lastName: string
  address: string
  phone: string
  position: string
  site: string
  department: string
  businessUnit: string
  segment: string
  localJobTitle: string
  hiringDate: string
  email: string
  status: string
  supervisor: string | null
  contractType: string
}

export interface EmployeeAccount {
  email: string
  accountStatus: string
  password: string
  role: string
  sendCredentials: boolean
}

export interface CreateEmployeeInput {
  employee: Omit<Employee, 'supervisor'> & { supervisor: string | null }
  account: EmployeeAccount | null
  photo: File | null
}

export interface UpdateEmployeeInput {
  employee: Employee
  photo: File | null
}

/** Shape returned by the ASP.NET backend for a single employee/user record. */
export interface EmployeeDto {
  id: string
  cin: string
  gender: string
  first_Name: string
  last_Name: string
  address: string
  tel: string
  position: string
  site: string
  department: string
  business_Unit: string
  segment: string
  local_Job_Title: string
  hiring_Date: string
  email: string
  status: string
  supervisor: string | null
  contract_Type: string
  photo?: string
}
