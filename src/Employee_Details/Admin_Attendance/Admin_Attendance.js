import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import * as XLSX from "xlsx";
import "./Admin_Attendance.css";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { FiDownload,   } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";


const Admin_Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterJobRole, setFilterJobRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const tableRef = useRef(null);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "employeeattendance"));

      const data = [];
      querySnapshot.forEach((docSnap) => {
        const docData = docSnap.data();
        if (Array.isArray(docData.attendance)) {
          docData.attendance.forEach((record, index) => {
            data.push({
              id: `${docSnap.id}_${index}`,
              docId: docSnap.id,
              index,
              employee: record.employee || docData.firstName || "Unknown",
              departments: record.departments || docData.departments || "-",
              date: record.date || "-",
              checkIn: record.checkIn || "-",
              checkOut: record.checkOut || "-",
              shift: record.shift || docData.shift || "-",
              workType: record.workType || docData.workType || "-",
              jobRole: record.jobRole || docData.jobRole || "-",
              reportingManager: record.reportingManager || "-",
              overtime: record.overtime || "-"
            });
          });
        }
      });

      setAttendanceData(data);
      setFilteredData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching attendance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    let filtered = [...attendanceData];

    if (filterDate) {
      filtered = filtered.filter(item => {
        if (!item.date) return false;
        const recordDate = new Date(item.date).toISOString().split("T")[0];
        return recordDate === filterDate;
      });
    }

    if (filterJobRole) {
      filtered = filtered.filter(item => 
        item.jobRole.toLowerCase() === filterJobRole.toLowerCase()
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.employee.toLowerCase().includes(term) ||
        item.departments.toLowerCase().includes(term) ||
        item.jobRole.toLowerCase().includes(term) ||
        item.reportingManager.toLowerCase().includes(term)
      );
    }

    setFilteredData(filtered);
    setSelectAll(false);
    setSelectedRows(new Set());
  }, [filterDate, filterJobRole, searchTerm, attendanceData]);

  const handleRowSelect = (id) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(id)) {
      newSelectedRows.delete(id);
    } else {
      newSelectedRows.add(id);
    }
    setSelectedRows(newSelectedRows);
    setSelectAll(newSelectedRows.size === filteredData.length && filteredData.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allIds = new Set(filteredData.map(item => item.id));
      setSelectedRows(allIds);
    }
    setSelectAll(!selectAll);
  };

  const exportToExcel = () => {
    let dataToExport = [];

    if (selectedRows.size > 0) {
      dataToExport = filteredData.filter(item => selectedRows.has(item.id));
    } else {
      dataToExport = filteredData;
    }

    if (dataToExport.length === 0) {
      alert("No data to export!");
      return;
    }

    const exportFormatted = dataToExport.map(({ id, docId, index, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(exportFormatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm(`Are you sure you want to delete the record of ${record.employee} on ${record.date}?`)) {
      return;
    }

    try {
      const docRef = doc(db, "employeeattendance", record.docId);
      const { getDoc, updateDoc } = await import("firebase/firestore");

      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        alert("Document does not exist!");
        return;
      }
      const data = docSnapshot.data();

      if (!Array.isArray(data.attendance)) {
        alert("Attendance data format incorrect!");
        return;
      }

      const newAttendance = [...data.attendance];
      newAttendance.splice(record.index, 1);
      await updateDoc(docRef, { attendance: newAttendance });

      alert("Record deleted successfully!");
      fetchAttendanceData();
    } catch (error) {
      alert("Failed to delete the record: " + error.message);
    }
  };

  const rowsToShow = selectedRows.size > 0
    ? filteredData.filter(item => selectedRows.has(item.id))
    : filteredData;

  if (loading) return (
    <div className="admin-attendance-loading">
      <div className="spinner"></div>
      <p>Loading attendance data...</p>
    </div>
  );

  if (error) return (
    <div className="admin-attendance-error">
      <div className="error-icon">!</div>
      <p>Error: {error}</p>
    </div>
  );

  return (
    <>
      <NavbarTopbar />
      <div className="admin-attendance-container">
        <h2 className="admin-attendance-title">Employee Attendance Records</h2>

        <div className="admin-attendance-controls">
          <div className="search-filter-container">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <select
                value={filterJobRole}
                onChange={(e) => setFilterJobRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
          </div>

          <div className="action-buttons">
            <div className="selection-control">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                id="select-all-checkbox"
              />
              <label htmlFor="select-all-checkbox">Select All</label>
            </div>

            <button onClick={exportToExcel} className="action-btn export-btn">
              <FiDownload /> Export Selected
            </button>
          </div>
        </div>

        <div className="table-container" ref={tableRef}>
          <table className="attendance-table">
            <thead>
              <tr>
                <th width="40px">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
                <th>Employee</th>
                <th>Department</th>
                <th width="120px">Date</th>
                <th width="100px">Check-In</th>
                <th width="100px">Check-Out</th>
                <th width="90px">Shift</th>
                <th width="120px">Work Type</th>
                <th width="120px">Job Role</th>
                <th>Reporting Manager</th>
                <th width="100px">Overtime</th>
                <th width="50px">Action</th>
              </tr>
            </thead>
            <tbody>
              {rowsToShow.length === 0 ? (
                <tr className="no-data-row">
                  <td colSpan="12">
                    <div className="no-records-message">
                      No attendance records found matching your criteria
                    </div>
                  </td>
                </tr>
              ) : (
                rowsToShow.map((record, idx) => (
                  <tr
                    key={record.id}
                    className={selectedRows.has(record.id) ? "selected-row" : ""}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(record.id)}
                        onChange={() => handleRowSelect(record.id)}
                        aria-label={`Select ${record.employee}'s record`}
                      />
                    </td>
                    <td>{record.employee}</td>
                    <td>{record.departments}</td>
                   <td>
  {record.date 
    ? (() => {
        const date = new Date(record.date);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      })()
    : "-"
  }
</td>
                    <td>{record.checkIn}</td>
                    <td>{record.checkOut}</td>
                    <td>{record.shift}</td>
                    <td>{record.workType}</td>
                    <td>{record.jobRole}</td>
                    <td>{record.reportingManager}</td>
                    <td>{record.overtime}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteRecord(record)}
                        className="admin-attendance-delete-btn"
                        aria-label={`Delete ${record.employee}'s record`}
                        title="Delete Record"
                      >
   <FaTrash />
                         </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Admin_Attendance;