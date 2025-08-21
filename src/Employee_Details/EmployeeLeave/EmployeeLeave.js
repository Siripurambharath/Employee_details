import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./EmployeeLeave.css";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { db, auth } from "../../Employee_Details/Firebase/Firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaTrash } from "react-icons/fa";

const EmployeeLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [userId, setUserId] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.badgeId) setBadgeId(data.badgeId);
          }
        } catch (err) {
          console.error("Error fetching badgeId:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (dateVal) => {
    if (!dateVal) return "-";
    if (dateVal.seconds) {
      return new Date(dateVal.seconds * 1000).toLocaleDateString("en-GB");
    }
    return new Date(dateVal).toLocaleDateString("en-GB");
  };

  useEffect(() => {
    const fetchLeaves = async () => {
      if (!userId) return;
      try {
        const docRef = doc(db, "addleave", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Reverse the array to show newest first
       const userLeaves = (data.leaves || [])
  .map((leave) => ({ ...leave, badgeId: leave.badgeId || badgeId }))
  .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)); // ✅ newest first

          setLeaves(userLeaves);
          setPage(0); // Reset to first page
        } else {
          setLeaves([]);
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
      }
    };

    fetchLeaves();
  }, [userId, badgeId]);

  // Delete a leave entry
  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete this leave?")) return;
    try {
      const docRef = doc(db, "addleave", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        let updatedLeaves = [...(docSnap.data().leaves || [])];
        updatedLeaves.splice(index, 1);
        await updateDoc(docRef, { leaves: updatedLeaves });
        setLeaves(updatedLeaves);
      }
    } catch (error) {
      console.error("Error deleting leave:", error);
    }
  };

  // Show comment modal
  const handleCommentClick = (comment) => {
    setSelectedComment(comment || "No comment available");
    setShowCommentModal(true);
  };

  const paginatedRows = leaves.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <NavbarTopbar />
      <div className="employee-leave-container mt-5">
        <h2 className="employee-leave-title">My Leaves</h2>
        <div className="employee-leave-header">
          <Link to="/addleave" className="employee-leave-add-btn">Add Leave</Link>
        </div>

        <div className="employee-leave-table-container">
          <table className="employee-leave-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Employee Name</th>
                <th>Badge ID</th>
                <th>Department</th>
                <th>Work Type</th>
                <th>Shift</th>
                <th>Leave Type</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, index) => (
                  <tr key={index}>
<td>{page * rowsPerPage + index + 1}</td>
                    <td>{row.firstName}</td>
                    <td>{row.badgeId}</td>
                    <td>{row.departments?.name || row.departments || "N/A"}</td>
                    <td>{row.workType?.name || row.workType || "N/A"}</td>
                    <td>{row.shift?.name || row.shift || "N/A"}</td>
                    <td>{row.leaveType}</td>
                    <td>{formatDate(row.fromDate)}</td>
                    <td>{formatDate(row.toDate)}</td>
                    <td>{row.requestedDays}</td>
                    <td>
                      <span className={`employee-leave-status employee-leave-status-${row.status?.toLowerCase() || 'pending'}`}>
                        {row.status || "Pending"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline-primary btn-sm" onClick={() => handleCommentClick(row.comment)}>
                        View Comment
                      </button>
                    </td>
                    <td className="employee-leave-actions">
                      <div className="employee-leave-action-buttons">
                        <button
                          className="employee-leave-action-btn employee-leave-delete-btn"
                          onClick={() => handleDelete(index)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="employee-leave-empty">No leaves found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="employee-leave-pagination">
          <div className="employee-leave-pagination-controls">
            <button
              className="employee-leave-pagination-btn"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              &lt;
            </button>
            <span className="employee-leave-pagination-info">
              Page {page + 1} of {Math.ceil(leaves.length / rowsPerPage) || 1}
            </span>
            <button
              className="employee-leave-pagination-btn"
              disabled={page >= Math.ceil(leaves.length / rowsPerPage) - 1 || leaves.length === 0}
              onClick={() => setPage(page + 1)}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="employee-leave-modal-overlay">
          <div className="employee-leave-modal">
            <div className="employee-leave-modal-header">
              <h3>Leave Comment</h3>
              <button className="employee-leave-modal-close" onClick={() => setShowCommentModal(false)}>
                &times;
              </button>
            </div>
            <div className="employee-leave-modal-body">
              <p>{selectedComment}</p>
            </div>
            <div className="employee-leave-modal-footer">
              <button className="employee-leave-modal-btn" onClick={() => setShowCommentModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeLeave;
