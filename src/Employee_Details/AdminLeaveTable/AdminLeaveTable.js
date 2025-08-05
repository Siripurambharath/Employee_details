import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { db } from "../Firebase/Firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import "./AdminLeaveTable.css";

const ROWS_PER_PAGE = 10;

const AdminLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [filterBadgeId, setFilterBadgeId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchLeaves = async () => {
      const querySnapshot = await getDocs(collection(db, "addleave"));
      let allLeaves = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.leaves && Array.isArray(data.leaves)) {
          data.leaves.forEach((leave) =>
            allLeaves.push({ ...leave, uid: docSnap.id })
          );
        }
      });
      setLeaves(allLeaves);
    };
    fetchLeaves();
  }, []);

  const handleAccept = async (rowIndex) => {
    const updatedLeaves = [...leaves];
    updatedLeaves[rowIndex].status = "Accepted";
    setLeaves(updatedLeaves);

    const uid = updatedLeaves[rowIndex].uid;
    const ref = doc(db, "addleave", uid);
    await updateDoc(ref, {
      leaves: updatedLeaves.filter((l) => l.uid === uid).map((l) => ({ ...l })),
    });
  };

  const handleReject = async (rowIndex) => {
    const updatedLeaves = [...leaves];
    updatedLeaves[rowIndex].status = "Rejected";
    setLeaves(updatedLeaves);

    const uid = updatedLeaves[rowIndex].uid;
    const ref = doc(db, "addleave", uid);
    await updateDoc(ref, {
      leaves: updatedLeaves.filter((l) => l.uid === uid).map((l) => ({ ...l })),
    });
  };

  const handleDelete = async (rowIndex) => {
    if (!window.confirm("Are you sure you want to delete this leave?")) return;
    const row = leaves[rowIndex];
    const uid = row.uid;
    const ref = doc(db, "addleave", uid);

    const updatedLeaves = leaves.filter((_, i) => i !== rowIndex);
    setLeaves(updatedLeaves);

    await updateDoc(ref, {
      leaves: updatedLeaves.filter((l) => l.uid === uid).map((l) => ({ ...l })),
    });
  };

  const toggleSelect = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredLeaves.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredLeaves.map((_, i) => i));
    }
  };

  const exportExcel = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one row to export");
      return;
    }
    
    const selectedData = selectedRows.map((i) => filteredLeaves[i]);
    const worksheet = XLSX.utils.json_to_sheet(selectedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaves");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Leaves.xlsx");
  };

  const filteredLeaves = leaves.filter((row) => {
    return (
      row.employeeName.toLowerCase().includes(searchName.toLowerCase()) &&
      (filterBadgeId === "" || row.badgeId === filterBadgeId)
    );
  });

  const totalPages = Math.ceil(filteredLeaves.length / ROWS_PER_PAGE);
  const paginatedData = filteredLeaves.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  return (
    <>
      <NavbarTopbar />
      <div className="adminleave-container container mt-1">
        <h3 className="text-center mb-4">Admin Leave </h3>

        {/* Search and Filter Controls */}
        <div className="search-filter-container mb-1">
          <div className="search-filter-box">
            <div className="search-input-group">
              <input
                type="text"
                className="form-control search-input"
                placeholder="Search by Name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <input
                type="text"
                className="form-control filter-input"
                placeholder="Filter BadgeId"
                value={filterBadgeId}
                onChange={(e) => setFilterBadgeId(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons mb-3">
          <button 
            className={`select-all-btn ${selectedRows.length === filteredLeaves.length ? 'active' : ''}`}
            onClick={handleSelectAll}
          >
            {selectedRows.length === filteredLeaves.length ? "Unselect All" : "Select All"}
          </button>
          <button 
            className="export-btn"
            onClick={exportExcel}
            disabled={selectedRows.length === 0}
          >
            Export Selected
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover table-bordered text-center adminleave-table">
            <thead className="adminleave-leavetable-head">
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filteredLeaves.length && filteredLeaves.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Employee Name</th>
                <th>BadgeId</th>
                <th>Department</th>
                <th>Work Type</th>
                <th>Shift</th>
                <th>Leave Type</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Requested Days</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Confirmation</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => {
                const globalIndex = (currentPage - 1) * ROWS_PER_PAGE + index;
                return (
                  <tr
                    key={globalIndex}
                    className={selectedRows.includes(globalIndex) ? "selected-row" : ""}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(globalIndex)}
                        onChange={() => toggleSelect(globalIndex)}
                      />
                    </td>
                    <td>{row.employeeName}</td>
                    <td>{row.BadgeId || "-"}</td>
                    <td>{row.departments}</td>
                    <td>{row.workType}</td>
                    <td>{row.shift}</td>
                    <td>{row.leaveType}</td>
                    <td>{row.fromDate}</td>
                    <td>{row.toDate}</td>
                    <td>{row.requestedDays}</td>
                    <td>
                      <span className={`status-badge ${row.status.toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <FaEdit
                        className="edit-icon"
                        title="Edit"
                      />
                      <FaTrash
                        className="delete-icon"
                        onClick={() => handleDelete(globalIndex)}
                        title="Delete"
                      />
                    </td>
                    <td className="confirmation-buttons">
                      <button
                        className="btn btn-sm accept-btn me-2"
                        onClick={() => handleAccept(globalIndex)}
                        disabled={row.status === "Accepted"}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-sm reject-btn"
                        onClick={() => handleReject(globalIndex)}
                        disabled={row.status === "Rejected"}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredLeaves.length > 0 && (
          <div className="pagination-controls d-flex justify-content-end mt-4">
            <button
              className="btn pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              &lt; 
            </button>
            <span className="page-info align-self-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
               &gt;
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminLeave;