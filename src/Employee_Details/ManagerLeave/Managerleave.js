import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Managerleave.css";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { db, auth } from "../../Employee_Details/Firebase/Firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
   import { FaChevronLeft, FaChevronRight } from "react-icons/fa";


const Managerleave = () => {
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
          const userLeaves = (data.leaves || []).map((leave) => ({
            ...leave,
            badgeId: leave.badgeId || badgeId,
          }));
          setLeaves(userLeaves);
        } else {
          setLeaves([]);
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
      }
    };

    fetchLeaves();
  }, [userId, badgeId]);

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

 
  const handleCommentClick = (comment) => {
    setSelectedComment(comment || "No comment available");
    setShowCommentModal(true);
  };

  const paginatedRows = leaves.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <NavbarTopbar />
      <div className="Manager-leave-container ">
        <div className="Manager-leave-header">
         
          <Link to="/addleave" className="Manager-leave-add-btn">
            Add Leave
          </Link>
        </div>
        
        <div className="Manager-leave-table-container">
          <table className="Manager-leave-table">
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
                      <span className={`Manager-leave-status Manager-leave-status-${row.status?.toLowerCase() || 'pending'}`}>
                        {row.status || "Pending"}
                      </span>
                    </td>
                    <td className="Manager-leave-comment-cell">
  {row.comment ? (
    <button 
      className="btn btn-outline-primary btn-sm"  
      onClick={() => handleCommentClick(row.comment)}
    >
      View Comment
    </button>
  ) : (
    "-"
  )}
</td>



                    <td className="Manager-leave-actions">
                      <div className="Manager-leave-action-buttons">
                 
                        <button
                          className="Manager-leave-action-btn Manager-leave-delete-btn"
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
                  <td colSpan="12" className="Manager-leave-empty">
                    No leaves found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


<div className="Manager-leave-pagination">
  <div className="Manager-leave-pagination-controls d-flex align-items-center gap-2">
    <button
       className="btn btn-sm btn-light border"
    style={{ backgroundColor: "#f0f0f0" }}
      disabled={page === 0}
      onClick={() => setPage(page - 1)}
    >
      <FaChevronLeft />
    </button>

    <span className="Manager-leave-pagination-info">
      Page {page + 1} of {Math.ceil(leaves.length / rowsPerPage) || 1}
    </span>

    <button
      className="btn btn-sm btn-light border"
    style={{ backgroundColor: "#f0f0f0" }}
      disabled={page >= Math.ceil(leaves.length / rowsPerPage) - 1 || leaves.length === 0}
      onClick={() => setPage(page + 1)}
    >
      <FaChevronRight />
    </button>
  </div>
</div>

      </div>

      {showCommentModal && (
        <div className="Manager-leave-modal-overlay">
          <div className="Manager-leave-modal">
            <div className="Manager-leave-modal-header">
              <h3>Leave Comment</h3>
              <button 
                className="Manager-leave-modal-close"
                onClick={() => setShowCommentModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="Manager-leave-modal-body">
              <p>{selectedComment}</p>
            </div>
            <div className="Manager-leave-modal-footer">
              <button
                className="Manager-leave-modal-btn"
                onClick={() => setShowCommentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Managerleave;