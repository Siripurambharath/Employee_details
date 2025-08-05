import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaUserCircle, FaEye, FaEdit, FaSignOutAlt } from "react-icons/fa";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../Firebase/Firebase";
import { doc, getDoc } from "firebase/firestore";
import "./EmployeeNavbar.css";
import companylogo2 from "../../Employee_Details/Image/companylogo2.png";

const EmployeeNavbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [badgeId, setBadgeId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        fetchUserName(user.uid);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchUserName = async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserName(data.firstName || "User");
        setBadgeId(data.badgeId || "");
      }
    } catch (err) {
      console.error("Error fetching username:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="navtop-layout-container">
      {/* Sidebar */}
      <aside className="employee-sidebar">
        <div className="navtop-sidebar-header d-flex align-items-center justify-content-between ">
          <img src={companylogo2} alt="Logo" className="navtop-sidebar-logo" />
        </div>

        <nav className="employee-sidebar-links">
          <NavLink to="/employeeleave" className="employee-sidebar-link">
            Employee Leave
          </NavLink>
          <NavLink to="/addleave" className="employee-sidebar-link">
            Add Leave
          </NavLink>
          <NavLink to="/employeeattendance" className="employee-sidebar-link">
            Employee Attendance
          </NavLink>
        </nav>
      </aside>

      {/* Top Bar */}
      <div className="navtop-topbar flex-grow d-flex justify-content-end align-items-center ">
        <div className="navtop-right-section d-flex align-items-center gap-2">
          <FaUserCircle className="navtop-avatar-icon" />
          <div className="employee-name-dropdown">
            <span
              className="employee-user-name"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              {userName} ▼
            </span>
            {dropdownOpen && (
              <div className="employee-dropdown-menu">
                <NavLink
                  to={`/about/${badgeId}`}
                  className="employee-dropdown-item"
                >
                  <FaEye /> View
                </NavLink>
                <NavLink
                  to={`/Editworkdetail/${badgeId}`}
                  className="employee-dropdown-item"
                >
                  <FaEdit /> Edit
                </NavLink>
                <button onClick={handleLogout} className="employee-dropdown-item">
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeNavbar;
