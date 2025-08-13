import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../Firebase/Firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import "./AssignStaff.css"; 

const AssignStaff = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [managerInfo, setManagerInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        // Get logged-in user info
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setManagerInfo(userData);

          // Check role
          if (userData.jobRole !== "Manager") {
            navigate("/");
            return;
          }

          const q = query(
            collection(db, "users"),
            where("reportingManager", "==", `${userData.firstName} (${userData.badgeId})`)
          );
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setEmployees(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <>
      <NavbarTopbar />
      <div className="assign-staff-container mt-4">
        <div className="assign-staff-header">
          <h2 >Assigned Staff</h2>
          {managerInfo && (
            <div className="manager-info-badge">
              Manager: {managerInfo.firstName} {managerInfo.lastName} (ID: {managerInfo.badgeId})
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive assign-staff-table-container">
            <table className="table assign-staff-table">
              <thead className="table-assign-staff">
                <tr>
                  <th className="badge-id-col">Badge ID</th>
                  <th className="name-col">Name</th>
                  <th className="dept-col">Department</th>
                  <th className="position-col">Job Position</th>
                 
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr key={emp.id} className="employee-row">
                      <td className="badge-id-col">{emp.badgeId || "-"}</td>
                      <td className="name-col">{`${emp.firstName || ""} ${emp.lastName || ""}`}</td>
                      <td className="dept-col">{emp.departments || "-"}</td>
                      <td className="position-col">{emp.jobPosition || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="no-data-row">
                    <td colSpan="5">
                      <div className="no-staff-message">
                        <i className="bi bi-people-fill"></i>
                        <p>No staff members are currently assigned to you.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AssignStaff;