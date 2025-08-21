import React, { useState } from "react";
import EmployeeManagerLeave from "../../Employee_Details/Employee_Manager_leave/Employee_manager_leave";
import ManagerLeave from "../../Employee_Details/ManagerLeave/Managerleave";
import "./LeaveManagement.css";
import NavbarTopbar from "../Navbar/NavbarTopbar";

const LeaveManagement = () => {
  const [activeTab, setActiveTab] = useState("employeeLeaves");

  return (
    <>
    <NavbarTopbar />
    <div className="leave-management-container">
     
<h2 className="leaves-management-title">Leaves</h2>
        <div className="leave-management-tabs">
          <button
            className={`tab-btn ${activeTab === "employeeLeaves" ? "active" : ""}`}
            onClick={() => setActiveTab("employeeLeaves")}
          >
            Employee Leaves
          </button>
          <button
            className={`tab-btn ${activeTab === "managerLeaves" ? "active" : ""}`}
            onClick={() => setActiveTab("managerLeaves")}
          >
            My Leaves
          </button>
        </div>
      </div>

      <div className="leave-management-content">
        {activeTab === "employeeLeaves" ? <EmployeeManagerLeave /> : <ManagerLeave />}
      </div>

    </>
  );
};

export default LeaveManagement;