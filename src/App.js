import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NavbarTopbar from './Employee_Details/Navbar/NavbarTopbar';
import Employees from './Employee_Details/Employee/Employees';
import AddEmployee from './Employee_Details/AddEmployee/AddEmployee';
import WorkDetail from './Employee_Details/EditEmployee/WorkDetail';
import BankDetail from './Employee_Details/EditEmployee/BankDetail';
import About from './Employee_Details/About/About';
import Adminlogin from './Employee_Details/Adminlogin/Adminlogn';
import LoginEmployee from './Employee_Details/LoginEmployee/LoginEmployee';
import Editworkdetail from './Employee_Details/Editworkdetail/Editworkdetail';
import EditBankDetail from './Employee_Details/EditBankDetail/EditBankDetail';
import Editaddemployee from './Employee_Details/EditAddEmployee/Editaddemployee';
import Settings from './Employee_Details/Settings/Settings'
import UnifiedLogin from './Employee_Details/LoginEmployee/UnifiedLogin';
import Dashboard from './Employee_Details/Dashboard/Dashboard';
import Login from './Employee_Details/LoginEmployee/Login';
import Payroll from './Employee_Details/Payroll/Payroll';
import PayslipTable from './Employee_Details/Payslip/PayslipTable';
import Payslipedit from './Employee_Details/PayslipEdit/Payslipedit'
import EmployeePayroll from './Employee_Details/EmployeePayroll/EmployeePayroll';
import { AuthProvider } from '../src/Employee_Details/Contextapi/Authcontext';
import EmployeeDashboard from './Employee_Details/EmployeeDashboard/EmployeeDashboard';
import EmployeeAttendance from "./Employee_Details/Employee_Attendance/EmployeeAttendance";
import AdminLeaveTable from "./Employee_Details/AdminLeaveTable/AdminLeaveTable";
import EmployeeLeave from './Employee_Details/EmployeeLeave/EmployeeLeave';
import Add_leave from './Employee_Details/EmployeeLeave/Addleave/Addleave';
import LeaveTypes from './Employee_Details/LeaveTypes/LeaveTypes';
import AddleaveType from './Employee_Details/LeaveTypes/AddleaveTypes/AddleaveType';
import EditLeaveTypes from './Employee_Details/LeaveTypes/EditLeaveTypes/EditLeaveTypes';
import AssignStaff from './Employee_Details/AssignStaff/AssignStaff';
import AdminStaff from './Employee_Details/AdminStaff/AdminStaff';
import ManagerAttendance from './Employee_Details/ManagerAttendance/ManagerAttendance';
import Manager_Employee_attendance from './Employee_Details/Manager_Employee_attendance/Manager_Employee_attendance';
import Admin_Attendance from './Employee_Details/Admin_Attendance/Admin_Attendance';
import Employee_manager_leave from './Employee_Details/Employee_Manager_leave/Employee_manager_leave';
import Managerleave from './Employee_Details/ManagerLeave/Managerleave';
import ManagerPayroll from './Employee_Details/ManagerPayroll/ManagerPayroll';
import LeaveManagement from './Employee_Details/ManagerleaveManagement/LeaveManagement';
import Managerdashboard from './Employee_Details/Managerdashboard/Managerdashboard'




const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/employee' element={<Employees />} />
          <Route path='/navbar' element={<NavbarTopbar />} />
          <Route path='/addemployee' element={<AddEmployee />} />
          <Route path='/workdetail' element={<WorkDetail />} />
          <Route path='/bankdetail' element={<BankDetail />} />
          <Route path="/about/:id" element={<About />} />
          <Route path='/adminlogin' element={<Adminlogin />} />
          <Route path='/loginemployee' element={<LoginEmployee />} />
          <Route path="/Editaddemployee/:badgeId" element={<Editaddemployee />} />
          <Route path="/Editworkdetail/:badgeId" element={<Editworkdetail />} />
          <Route path="/Editbankdetail/:badgeId" element={<EditBankDetail />} />
          <Route path='/setting' element={<Settings />} />
          <Route path='/' element={<UnifiedLogin />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/payslip" element={<PayslipTable />} />
          <Route path="/payslipedit/:employeeId/:date" element={<Payslipedit />} />
          <Route path='/employeepayroll/:id' element={<EmployeePayroll />} />
          <Route path="/employeedashboard" element={<EmployeeDashboard />} />
          <Route path="/employeeattendance" element={<EmployeeAttendance />} />
          <Route path="/adminleavetable" element={<AdminLeaveTable />} />
          <Route path='/employeeleave' element={<EmployeeLeave />} />
          <Route path='/addleave' element={<Add_leave />} />
          <Route path='/leavetypes' element={<LeaveTypes />} />
          <Route path='/addleavetypes' element={<AddleaveType />} />
          <Route path='/edittypeleave' element={<EditLeaveTypes />} />
          <Route path='/assignstaff' element={<AssignStaff />} />
          <Route path='/adminstaff' element={<AdminStaff />} />
          <Route path='/managerattendance' element={<ManagerAttendance />} />
          <Route path='/employee_manager_attendance' element={<Manager_Employee_attendance />} />

          <Route path='/adminattendance' element={<Admin_Attendance />} />
          <Route path='/employeemanagaerleave' element={<Employee_manager_leave />} />
          <Route path='/managerleave' element={<Managerleave />} />

          <Route path='/managerpayroll' element={<ManagerPayroll />} />

          <Route path='/leaevemanagement' element={<LeaveManagement />} />
          <Route path='/managerdashboard' element={<Managerdashboard />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
