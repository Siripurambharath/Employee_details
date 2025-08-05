import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./EmployeeLeave.css";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { db, auth } from "../../Employee_Details/Firebase/Firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaEdit, FaTrash } from "react-icons/fa";

const EmployeeLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [userId, setUserId] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const navigate = useNavigate();

  // Fetch logged-in user id and badgeId
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


  // Fetch leaves from array inside user doc
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
            badgeId: leave.badgeId || badgeId, // Ensure badgeId is present
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

  const handleEdit = (leave, index) => {
    navigate("/addleave", { state: { leave, index } });
  };

  const paginatedRows = leaves.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <NavbarTopbar />
      <div className="leave-container">
        <h2 className="leave-heading">My Leaves</h2>
        <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-3 leave-controls-row">
          <Link to="/addleave" className="btn btn-primary leave-add-btn">
            Add Leave
          </Link>
        </div>
        <div className="leave-table-responsive">
          <table className="table table-bordered text-center leave-table">
            <thead className="table-success">
              <tr>
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
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={index}>
                  <td>{row.employeeName}</td>
                  <td>{row.badgeId}</td>
                  <td>{row.departments}</td>
                  <td>{row.workType}</td>
                  <td>{row.shift}</td>
                  <td>{row.leaveType}</td>
              <td>{formatDate(row.fromDate)}</td>

               <td>{formatDate(row.toDate)}</td>

                  <td>{row.requestedDays}</td>
                  <td style={{ fontWeight: "bold" }}>{row.status}</td>
                  <td>
                    <FaEdit
                      style={{ cursor: "pointer", marginRight: "10px", color: "#0d6efd" }}
                      onClick={() => handleEdit(row, index)}
                      title="Edit"
                    />
                    <FaTrash
                      style={{ cursor: "pointer", color: "#dc3545" }}
                      onClick={() => handleDelete(index)}
                      title="Delete"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="leave-pagination">
       
          <div className="d-flex align-items-center  gap-2 mt-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>
              Page {page + 1} of {Math.ceil(leaves.length / rowsPerPage)}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= Math.ceil(leaves.length / rowsPerPage) - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeLeave;
