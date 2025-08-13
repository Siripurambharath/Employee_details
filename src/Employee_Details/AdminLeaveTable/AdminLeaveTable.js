import React, { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { db } from "../Firebase/Firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc
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
  const [filterJobRole, setFilterJobRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedLeaveIndex, setSelectedLeaveIndex] = useState(null);

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

  const updateLeaveInDB = async (rowIndex, updates) => {
    const updatedLeaves = [...leaves];
    updatedLeaves[rowIndex] = { ...updatedLeaves[rowIndex], ...updates };
    setLeaves(updatedLeaves);

    const uid = updatedLeaves[rowIndex].uid;
    const ref = doc(db, "addleave", uid);

    const leavesForUID = updatedLeaves.filter((l) => l.uid === uid);
    await updateDoc(ref, {
      leaves: leavesForUID
    });
  };

  const handleStatusChange = async (rowIndex, newStatus) => {
    if (!window.confirm(`Change status to ${newStatus}?`)) return;
    await updateLeaveInDB(rowIndex, { status: newStatus });
  };

  const handleDelete = async (rowIndex) => {
    if (!window.confirm("Are you sure you want to delete this leave?")) return;

    const leaveToDelete = leaves[rowIndex];
    const uid = leaveToDelete.uid;

    // Remove from local state
    const updatedLeaves = leaves.filter((_, i) => i !== rowIndex);
    setLeaves(updatedLeaves);

    // Remove from Firestore doc
    const ref = doc(db, "addleave", uid);
    const remainingLeaves = updatedLeaves.filter((l) => l.uid === uid);

    if (remainingLeaves.length > 0) {
      await updateDoc(ref, { leaves: remainingLeaves });
    } else {
      await deleteDoc(ref);
    }
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

  const openCommentModal = (index) => {
    setSelectedLeaveIndex(index);
    setCommentText(leaves[index].comment || "");
    setShowModal(true);
  };

  const saveComment = async () => {
    if (selectedLeaveIndex === null) return;
    await updateLeaveInDB(selectedLeaveIndex, { comment: commentText });
    setShowModal(false);
    setSelectedLeaveIndex(null);
    setCommentText("");
  };

  const filteredLeaves = leaves.filter((row) => {
    return (
      row.firstName?.toLowerCase().includes(searchName.toLowerCase()) &&
      (filterBadgeId === "" || row.badgeId === filterBadgeId) &&
      (filterJobRole === "" || row.jobRole === filterJobRole)
    );
  });

  const totalPages = Math.ceil(filteredLeaves.length / ROWS_PER_PAGE);
  const paginatedData = filteredLeaves.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const uniqueJobRoles = [...new Set(leaves.map(leave => leave.jobRole))].filter(Boolean);

  const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj)) return dateStr; 
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); 
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};


  return (
    <>
      <NavbarTopbar />
      <div className="adminleave-container container mt-5">
        <h3 className="text-center mb-1">Admin Leave</h3>

        {/* Search & Filters */}
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
              <select
                className="form-control filter-select"
                value={filterJobRole}
                onChange={(e) => setFilterJobRole(e.target.value)}
              >
                <option value="">All Roles</option>
                {uniqueJobRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
                <th>
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
                <th>Job Role</th>
                <th>Leave Type</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Requested Days</th>
                <th>Status</th>
                <th>confirmation</th>
               
                <th>Comment</th>
                 <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => {
                const globalIndex = (currentPage - 1) * ROWS_PER_PAGE + index;
                return (
                  <tr key={globalIndex} className={selectedRows.includes(globalIndex) ? "selected-row" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(globalIndex)}
                        onChange={() => toggleSelect(globalIndex)}
                      />
                    </td>
                
                    <td>{row.firstName}</td>
                    <td>{row.badgeId  }</td>
                    <td>{row.departments}</td>
                    <td>{row.workType}</td>
                    <td>{row.shift}</td>
                    <td>{row.jobRole}</td>
                    <td>{row.leaveType}</td>
                <td>{formatDate(row.fromDate)}</td>
<td>{formatDate(row.toDate)}</td>

                    <td>{row.requestedDays}</td>
                    <td>
                      <span className={`adminleave-status-badge ${row.status?.toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatusChange(globalIndex, "Accepted")}
                          disabled={row.status === "Accepted"}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStatusChange(globalIndex, "Rejected")}
                          disabled={row.status === "Rejected"}
                        >
                          Reject
                        </button>
                    
                      </div>
                    </td>
                
                    <td>
                      <button className="btn btn-outline-primary btn-sm" onClick={() => openCommentModal(globalIndex)}>
                        {row.comment ? "View/Edit" : "Add"} Comment
                      </button>
                    </td>

                        <td>
                          <button
                          className="btn admin-leave-outline-danger btn-sm"
                          onClick={() => handleDelete(globalIndex)}
                        >
                          <FaTrash />
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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

      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Leave Request Comment</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <textarea
                  className="form-control"
                  rows="4"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write your comment here..."
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={saveComment}>
                  Save Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminLeave;
