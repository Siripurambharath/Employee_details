import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaSignOutAlt,
  FaUserCircle,
  FaEye,
  FaEdit,
  FaChevronDown,
} from "react-icons/fa";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../Firebase/Firebase";
import { doc, getDoc } from "firebase/firestore";
import companylogo2 from "../Image/companylogo2.png";
import "bootstrap/dist/css/bootstrap.min.css";
import "./NavbarTopbar.css";


const NavbarTopbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [payrollDropdown, setPayrollDropdown] = useState(false);
  const [leaveDropdown, setLeaveDropdown] = useState(false);


  const [userName, setUserName] = useState("Admin");
  const [isAdmin, setIsAdmin] = useState(null);
  const [badgeId, setBadgeId] = useState("");

  const navigate = useNavigate();

  // Fetch user details from Firestore
  const fetchUserName = async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserName(data.firstName || "User");
        if (data.badgeId) setBadgeId(data.badgeId);
      }
    } catch (err) {
      console.error("Error fetching username:", err);
    }
  };

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const email = (user.email || "").toLowerCase().trim();
        if (email === "admin@gmail.com") {
          setUserName("Admin");
          setIsAdmin(true);
        } else {
          fetchUserName(user.uid);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (

    <div className="navtop-layout-container d-flex">
      {/* Sidebar */}
      <div className="navtop-sidebar d-flex flex-column ">
        <div className="navtop-sidebar-header d-flex align-items-center justify-content-between ">
          <img src={companylogo2} alt="Logo" className="navtop-sidebar-logo" />
          <button
            className="navtop-sidebar-toggle d-md-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaBars />
          </button>
        </div>

        <div
          className={`navtop-sidebar-links flex-column ${isOpen ? "open d-flex" : "d-none"
            } d-md-flex`}
        >
          <NavLink to="/dashboard" className="navtop-sidebar-link nav-link">
            Dashboard
          </NavLink>
               <NavLink to="/adminstaff" className="navtop-sidebar-link nav-link">
            Admined Staff 
          </NavLink>

            <NavLink to="/assignstaff" className="navtop-sidebar-link nav-link">
            Assigned Staff 
          </NavLink>

          <NavLink to="/employee" className="navtop-sidebar-link nav-link">
            Employee
          </NavLink>
          <NavLink to="/attendance" className="navtop-sidebar-link nav-link">
            Attendance
          </NavLink>
          <NavLink to="/employeeattendance" className="navtop-sidebar-link nav-link">
            Employee Attendance
          </NavLink>
          <div className="navtop-leave-container">
            <button
              className="navtop-leave-btn"
              onClick={() => setLeaveDropdown((prev) => !prev)}
            >
              <span className="navtop-leave-link-text">Admin Leave</span>
              <FaChevronDown
                className={`navtop-leave-icon ${leaveDropdown ? "open" : ""}`}
              />
            </button>

            {leaveDropdown && (
              <div className="navtop-leave-dropdown">
                   
                       <NavLink to="/adminleavetable" className="navtop-leave-link nav-link">
                 Admin Leave 
                </NavLink>
                
                <NavLink to="/adminleavedashboard" className="navtop-leave-link nav-link">
                  Leaves Dashboard
                </NavLink>
                <NavLink to="/leavetypes" className="navtop-leave-link nav-link">
                  Leave Types
                </NavLink>
              </div>
            )}
          </div>


          <NavLink to="/employeeleave" className="navtop-sidebar-link nav-link">
            Employee leave
          </NavLink>
      


          {/* Payroll Dropdown */}
          <div className="navtop-payroll-container">
            <button
              className="navtop-payroll-btn"
              onClick={() => setPayrollDropdown((prev) => !prev)}
            >
              <span className="navtop-payroll-link-text">Payroll</span>
              <FaChevronDown
                className={`navtop-payroll-icon ${payrollDropdown ? "open" : ""
                  }`}
              />
            </button>

            {payrollDropdown && (
              <div className="navtop-payroll-dropdown">
                <NavLink to="/payroll" className="navtop-payroll-link nav-link">
                  Payroll Home
                </NavLink>
                <NavLink to="/payslip" className="navtop-payroll-link nav-link">
                  Payslip
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/setting" className="navtop-sidebar-link nav-link">
            Settings
          </NavLink>
        </div>
      </div>

      {/* Topbar (Right Aligned Avatar & Dropdown) */}
      <div className="navtop-topbar flex-grow d-flex justify-content-end align-items-center ">
        <div className="navtop-right-section d-flex align-items-center gap-2">
          <FaUserCircle className="navtop-avatar-icon" />
          <div className="navtop-name-dropdown">
            <span
              className="navtop-user-name"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              {userName} ▼
            </span>

            {dropdownOpen && (
              <div className="navtop-dropdown-menu">
                {isAdmin ? (
                  <button onClick={handleLogout} className="navtop-dropdown-item">
                    <FaSignOutAlt /> Logout
                  </button>
                ) : (
                  <>
                    <NavLink
                      to={`/about/${badgeId}`}
                      className="navtop-dropdown-item"
                    >
                      <FaEye /> View
                    </NavLink>
                    <NavLink
                      to={`/Editworkdetail/${badgeId}`}
                      className="navtop-dropdown-item"
                    >
                      <FaEdit /> Edit
                    </NavLink>
                    <button onClick={handleLogout} className="navtop-dropdown-item">
                      <FaSignOutAlt /> Logout
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

  );
};

export default NavbarTopbar;
