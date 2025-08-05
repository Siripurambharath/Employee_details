import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { db } from "../Firebase/Firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import "./Attendance.css";

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    filterAttendance();
  }, [attendance, selectedDate]);

  const fetchAttendance = async () => {
    try {
      const snapshot = await getDocs(collection(db, "employeeattendance"));
      let rows = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const uid = docSnap.id;

        if (Array.isArray(data.attendance)) {
          data.attendance.forEach((item, index) => {
            rows.push({
              docId: uid,
              index,
              employee: item.employee || data.employee || "Unknown",
              departments: item.departments || data.departments || "N/A",
              date: item.date || "",
              day: item.day || "",
              checkIn: item.checkIn || "",
              checkInDate: item.checkInDate || "",
              checkOut: item.checkOut || "",
              checkOutDate: item.checkOutDate || "",
              shift: item.shift || data.shift || "N/A",
              workType: item.workType || data.workType || "N/A",
              overtime: item.overtime || "",
            });
          });
        }
      });
      setAttendance(rows);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const filterAttendance = () => {
    if (!selectedDate) {
      setFilteredData(attendance);
      return;
    }
    const day = selectedDate.getDate();
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();

    const filtered = attendance.filter((item) => {
      const d = new Date(item.date);
      return (
        d.getDate() === day &&
        d.getMonth() + 1 === month &&
        d.getFullYear() === year
      );
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async (docId, index) => {
    try {
      const snapshot = await getDocs(collection(db, "employeeattendance"));
      const targetDoc = snapshot.docs.find((d) => d.id === docId);

      if (targetDoc.exists()) {
        const data = targetDoc.data();
        let updatedAttendance = [...(data.attendance || [])];
        updatedAttendance.splice(index, 1);

        await updateDoc(doc(db, "employeeattendance", docId), {
          attendance: updatedAttendance,
        });
        fetchAttendance();
      }
    } catch (error) {
      console.error("Error deleting attendance record:", error);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return dateString; // fallback if invalid date
    return dateObj.toLocaleDateString("en-GB").replace(/\//g, ".");
  };

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);

  return (
    <>
      <NavbarTopbar />
      <div className="container attendance-container">
      
          <h3 className="attendance-title">Attendance Records</h3>
          <div className="attendance-datepicker-wrapper">
            <DatePicker
              className="form-control attendance-datepicker"
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              placeholderText="Select Date"
              dateFormat="dd/MM/yyyy"
              isClearable
              popperPlacement="auto"
              popperClassName="attendance-datepicker-popper"
            />
          </div>
        </div>

        <div className="table-responsive attendance-table-container">
          <table className="table table-hover align-middle text-center attendance-table">
            <thead className="attendance-head">
              <tr>
                <th>S.No</th>
                <th>Employee</th>
                <th>Departments</th>
                <th>Date</th>
                <th>Day</th>
                <th>Check-In</th>
                <th>In Date</th>
                <th>Check-Out</th>
                <th>Out Date</th>
                <th>Shift</th>
                <th>Work Type</th>
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
                    <td>{item.day}</td>
                    <td>{item.checkIn}</td>
                    <td>{formatDate(item.checkInDate)}</td>
                    <td>{item.checkOut}</td>
                    <td>{formatDate(item.checkOutDate)}</td>
                    <td>{item.shift}</td>
                    <td>{item.workType}</td>
                    <td>{item.overtime}</td>
                    <td>
                      <FaEdit
                        className="text-primary me-3"
                        style={{ cursor: "pointer" }}
                      />
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
                  <td colSpan="13" className="fw-semibold text-muted">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
        )}
 
    </>
  );
};

export default Attendance;
