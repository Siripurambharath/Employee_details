import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaTrash } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { auth, db } from "../Firebase/Firebase";
import { collection, getDocs, updateDoc, doc, getDoc, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Manager_Employee_attendance.css";

const Manager_Employee_attendance = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedJobRole, setSelectedJobRole] = useState("");
  const [managerInfo, setManagerInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setManagerInfo(userData);

          if (userData.jobRole !== "Manager") {
            navigate("/");
            return;
          }

          const managerIdentifier = `${userData.firstName} (${userData.badgeId})`;
          await fetchAttendance(userData, managerIdentifier);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchAttendance = async (managerData, managerIdentifier) => {
    try {
      const employeesQuery = query(
        collection(db, "users"),
        where("reportingManager", "==", managerIdentifier)
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      
      const employeeIds = employeesSnapshot.docs.map(doc => doc.id);
      employeeIds.push(managerData.uid);

      const attendanceSnapshot = await getDocs(collection(db, "employeeattendance"));
      let rows = [];
      
      attendanceSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const uid = docSnap.id;

        if (employeeIds.includes(uid) && Array.isArray(data.attendance)) {
          data.attendance.forEach((item, index) => {
            rows.push({
              docId: uid,
              index,
              employee: item.employee || data.firstName || "Unknown",
              departments: item.departments || data.departments || "N/A",
              date: item.date || "",
              day: item.day || "",
              checkIn: item.checkIn || "",
              checkInDate: item.checkInDate || "",
              checkOut: item.checkOut || "",
              checkOutDate: item.checkOutDate || "",
              shift: item.shift || data.shift || "N/A",
              workType: item.workType || data.workType || "N/A",
              reportingManager: item.reportingManager || "",
              overtime: item.overtime || "",
              jobRole: item.jobRole || data.jobRole || "N/A",
            });
          });
        }
      });
      setAttendance(rows);
      setFilteredData(rows);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  useEffect(() => {
    filterAttendance();
  }, [attendance, selectedDate, selectedJobRole]);

  const filterAttendance = () => {
    let filtered = [...attendance];

    if (selectedDate) {
      const day = selectedDate.getDate();
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();

      filtered = filtered.filter((item) => {
        const d = new Date(item.date);
        return (
          d.getDate() === day &&
          d.getMonth() + 1 === month &&
          d.getFullYear() === year
        );
      });
    }

    if (selectedJobRole) {
      filtered = filtered.filter(
        (item) => item.jobRole && item.jobRole.toLowerCase() === selectedJobRole.toLowerCase()
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async (docId, index) => {
    try {
      const targetDoc = doc(db, "employeeattendance", docId);
      const docSnap = await getDoc(targetDoc);

      if (docSnap.exists()) {
        const data = docSnap.data();
        let updatedAttendance = [...(data.attendance || [])];
        updatedAttendance.splice(index, 1);

        await updateDoc(targetDoc, {
          attendance: updatedAttendance,
        });

        const managerIdentifier = `${managerInfo.firstName} (${managerInfo.badgeId})`;
        await fetchAttendance(managerInfo, managerIdentifier);
      }
    } catch (error) {
      console.error("Error deleting attendance record:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return dateString;
    return dateObj.toLocaleDateString("en-GB").replace(/\//g, ".");
  };

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  return (
    <>
      <NavbarTopbar />
      <div className="employee_attendance-container mt-5">
        <h3 className="employee_attendance-title">Attendance Records</h3>

    <div className="employee_attendance-filters">
  {/* Job Role Filter */}
  <select
    className="employee_attendance-dropdown"
    value={selectedJobRole}
    onChange={(e) => setSelectedJobRole(e.target.value)}
  >
    <option value="">All Roles</option>
    <option value="Employee">Employee</option>
    <option value="Manager">Manager</option>
  </select>

  <div className="employee_attendance-datepicker">
    <DatePicker
      selected={selectedDate}
      onChange={(date) => setSelectedDate(date)}
      placeholderText="Select Date"
      dateFormat="dd/MM/yyyy"
      isClearable
    />
  </div>
</div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="employee_attendance-table-container table-responsive">
            <table className="employee_attendance-table table table-hover align-middle text-center">
              <thead className="employee_attendance-head">
                <tr>
                  <th>S.No</th>
                  <th>Employee</th>
                  <th>Departments</th>
                  <th>Date</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Shift</th>
                  <th>Work Type</th>
                  <th>Job Role</th>
                  <th>Reporting Manager</th>
                  <th>Overtime</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((item, idx) => (
                    <tr key={`${item.docId}-${idx}`}>
                      <td>{indexOfFirstRow + idx + 1}</td>
                      <td>{item.employee}</td>
                      <td>{item.departments}</td>
                      <td>{formatDate(item.date)}</td>
                      <td>{item.checkIn}</td>
                      <td>{item.checkOut}</td>
                      <td>{item.shift}</td>
                      <td>{item.workType}</td>
                      <td>{item.jobRole}</td>
                      <td>{item.reportingManager}</td>
                      <td>{item.overtime}</td>
                      <td>
                     
                        <FaTrash
                          className="text-danger"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDelete(item.docId, item.index)}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="no-data">
                      No attendance records found for your team
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                &lt;
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                &gt;
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Manager_Employee_attendance;
