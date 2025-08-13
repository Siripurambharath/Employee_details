// NavbarTopbar.js
import React, { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaChevronDown,
  FaUserCircle,
  FaEye,
  FaEdit,
  FaSignOutAlt,
} from "react-icons/fa";
import { AuthContext } from "../../Employee_Details/Contextapi/Authcontext";
import { signOut } from "firebase/auth";
import { auth } from "../../Employee_Details/Firebase/Firebase";
import companylogo2 from "../../Employee_Details/Image/companylogo2.png";
import "./NavbarTopbar.css";

function NavbarTopbar() {
  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [leaveDropdown, setLeaveDropdown] = useState(false);
  const [payrollDropdown, setPayrollDropdown] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = currentUser?.jobRole ?? "Admin";
const userName = (role === "Employee" || role === "Manager") 
  ? currentUser?.firstName || "User" 
  : "User";

  const badgeId = currentUser?.badgeId ?? "001";
  const isEmployee = role === "Employee" || role === "Manager";

  const closeSidebar = () => setMobileOpen(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");
      setCurrentUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="navtop-container">
      <button
        className="navtop-mobile-toggle"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        ☰
      </button>

      <div className={`navtop-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <img src={companylogo2} alt="Company Logo" className="navtop-logo" />

        {role === "Employee" && (
          <>
           
            <NavLink to="/employee" className="navtop-sidebar-link" onClick={closeSidebar}>
              Employee
            </NavLink>
            <NavLink to="/employeeattendance" className="navtop-sidebar-link" onClick={closeSidebar}>
              Employee Attendance
            </NavLink>
          
             <NavLink to="/attendance" className="navtop-sidebar-link" onClick={closeSidebar}>
              Attendance
            </NavLink>
              <NavLink to="/employeeleave" className="navtop-sidebar-link" onClick={closeSidebar}>
              Employee Leave
            </NavLink>
          </>
        )}

        {role === "Manager" && (
          <>
            <NavLink to="/employee" className="navtop-sidebar-link" onClick={closeSidebar}>
              Employee
            </NavLink>
            <NavLink to="/assignstaff" className="navtop-sidebar-link" onClick={closeSidebar}>
              Assigned Staff
            </NavLink>
             <NavLink to="/employee_manager_attendance" className="navtop-sidebar-link" onClick={closeSidebar}>
              Employee attendance
            </NavLink>

                <NavLink to="/managerattendance" className="navtop-sidebar-link" onClick={closeSidebar}>
             Attendance
            </NavLink>

                 <NavLink to="/employeemanagaerleave" className="navtop-sidebar-link" onClick={closeSidebar}>
             EmployeLeave
            </NavLink>

             <NavLink to="/Managerleave" className="navtop-sidebar-link" onClick={closeSidebar}>
              Manager Leave
            </NavLink>

                  <NavLink to="/managerpayroll" className="navtop-sidebar-link" onClick={closeSidebar}>
              Manager Payroll
            </NavLink>
        
          </>
        )}

        {role === "Admin" && (
          <>
            <NavLink to="/dashboard" className="navtop-sidebar-link" onClick={closeSidebar}>
              Dashboard
            </NavLink>
       
        <NavLink to="/employee" className="navtop-sidebar-link" onClick={closeSidebar}>
              Employee
            </NavLink>
          
       
            <NavLink to="/adminstaff" className="navtop-sidebar-link" onClick={closeSidebar}>
              Admined Staff
            </NavLink>
                   <NavLink to="/adminattendance" className="navtop-sidebar-link" onClick={closeSidebar}>
              Attendance
            </NavLink>
           
           

            <div className="navtop-leave-container">
              <button className="navtop-leave-btn" onClick={() => setLeaveDropdown(!leaveDropdown)}>
                <span>Admin </span>
                <FaChevronDown className={`navtop-leave-icon ${leaveDropdown ? "open" : ""}`} />
              </button>
              {leaveDropdown && (
                <div className="navtop-leave-dropdown">
                  <NavLink to="/adminleavetable" className="navtop-leave-link" onClick={closeSidebar}>
                    Admin   
                  </NavLink>
                  {/* <NavLink to="/adminleavedashboard" className="navtop-leave-link" onClick={closeSidebar}>
                    Leaves Dashboard
                  </NavLink> */}
                  <NavLink to="/leavetypes" className="navtop-leave-link" onClick={closeSidebar}>
                    Leave Types
                  </NavLink>
                </div>
              )}
            </div>
            <div className="navtop-payroll-container">
              <button className="navtop-payroll-btn" onClick={() => setPayrollDropdown(!payrollDropdown)}>
                <span>Payroll</span>
                <FaChevronDown className={`navtop-payroll-icon ${payrollDropdown ? "open" : ""}`} />
              </button>
              {payrollDropdown && (
                <div className="navtop-payroll-dropdown">
                  <NavLink to="/payroll" className="navtop-payroll-link" onClick={closeSidebar}>
                    Payroll Home
                  </NavLink>
                  <NavLink to="/payslip" className="navtop-payroll-link" onClick={closeSidebar}>
                    Payslip
                  </NavLink>
                </div>
              )}
            </div>
            <NavLink to="/setting" className="navtop-sidebar-link" onClick={closeSidebar}>
              Settings
            </NavLink>
          </>
        )}
      </div>

      {mobileOpen && <div className="navtop-overlay" onClick={closeSidebar}></div>}

      <div className="navtop-topbar">
        <div className="navtop-right-section">
          <FaUserCircle className="navtop-avatar-icon" />
          <div className="navtop-name-dropdown">
            <span className="navtop-user-name" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {userName} ▼
            </span>
            {dropdownOpen && (
              <div className="navtop-dropdown-menu">
                {isEmployee ? (
                  <>
                    <NavLink to={`/about/${badgeId}`} className="navtop-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <FaEye /> View
                    </NavLink>
                    <NavLink to={`/Editworkdetail/${badgeId}`} className="navtop-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <FaEdit /> Edit
                    </NavLink>
                    <button onClick={handleLogout} className="navtop-dropdown-item">
                      <FaSignOutAlt /> Logout
                    </button>
                  </>
                ) : (
                  <button onClick={handleLogout} className="navtop-dropdown-item">
                    <FaSignOutAlt /> Logout
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavbarTopbar;