import React, { useEffect, useState } from "react";
import { auth, db } from "../Firebase/Firebase";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { FaTrash } from "react-icons/fa";

import "./Employee_manager_leave.css";
import NavbarTopbar from "../Navbar/NavbarTopbar";

const Employee_manager_leave = () => {
    const [leaveData, setLeaveData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [commentText, setCommentText] = useState("");
    const [filterRole, setFilterRole] = useState("All");
    const [isCommentReadOnly, setIsCommentReadOnly] = useState(false);

    useEffect(() => {
        fetchLeavesForManager();
    }, []);

    const fetchLeavesForManager = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const managerDocRef = doc(db, "users", user.uid);
            const managerSnap = await getDoc(managerDocRef);

            if (!managerSnap.exists()) {
                console.error("Manager data not found.");
                return;
            }

            const { firstName, badgeId, jobRole } = managerSnap.data();
            const managerIdString = `${firstName} (${badgeId})`;

            const leavesRef = collection(db, "addleave");
            const leavesSnap = await getDocs(leavesRef);

            let allLeaves = [];

            leavesSnap.forEach((docSnap) => {
                const docData = docSnap.data();
                if (Array.isArray(docData.leaves)) {
                    docData.leaves.forEach((leaveItem, index) => {
                        const leaveBadgeId = leaveItem.badgeId || leaveItem.BadgeId || "";
                        const leaveJobRole = leaveItem.jobRole || "";

                        const isEmployeeUnderManager =
                            leaveJobRole === "Employee" &&
                            leaveItem.reportingManager === managerIdString;

                        const isManagerSelfLeave =
                            leaveBadgeId === badgeId && leaveJobRole === jobRole;

                        if (isEmployeeUnderManager || isManagerSelfLeave) {
                            allLeaves.push({
                                docId: docSnap.id,
                                index,
                                ...leaveItem,
                            });
                        }
                    });
                }
            });

            setLeaveData(allLeaves);
        } catch (error) {
            console.error("Error fetching leaves:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (leave, newStatus) => {
        try {
            const leaveDocRef = doc(db, "addleave", leave.docId);
            const docSnap = await getDoc(leaveDocRef);
            if (!docSnap.exists()) return;

            let updatedLeaves = [...docSnap.data().leaves];
            updatedLeaves[leave.index] = {
                ...updatedLeaves[leave.index],
                status: newStatus,
            };

            await updateDoc(leaveDocRef, { leaves: updatedLeaves });
            fetchLeavesForManager();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const openCommentModal = (leave) => {
        setSelectedLeave(leave);
        setCommentText(leave.comment || "");
        setIsCommentReadOnly(leave.jobRole === "Manager" && leave.status === "Accepted"); // <-- Set readonly flag
        setShowModal(true);
    };

    const saveComment = async () => {
        if (!selectedLeave) return;
        try {
            const leaveDocRef = doc(db, "addleave", selectedLeave.docId);
            const docSnap = await getDoc(leaveDocRef);
            if (!docSnap.exists()) return;

            let updatedLeaves = [...docSnap.data().leaves];
            updatedLeaves[selectedLeave.index] = {
                ...updatedLeaves[selectedLeave.index],
                comment: commentText,
            };

            await updateDoc(leaveDocRef, { leaves: updatedLeaves });
            setShowModal(false);
            fetchLeavesForManager();
        } catch (error) {
            console.error("Error saving comment:", error);
        }
    };

    const formatDate = (date) => {
        if (!date) return "-";
        let jsDate;
        if (date.seconds) {
            jsDate = date.toDate();
        } else {
            jsDate = new Date(date);
        }
        const day = String(jsDate.getDate()).padStart(2, "0");
        const month = String(jsDate.getMonth() + 1).padStart(2, "0");
        const year = jsDate.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const filteredLeaveData =
        filterRole === "All"
            ? leaveData
            : leaveData.filter((leave) => leave.jobRole === filterRole);


    const handleDelete = async (leaveToDelete) => {
        if (!window.confirm("Are you sure you want to delete this leave?")) return;

        try {
            const leaveDocRef = doc(db, "addleave", leaveToDelete.docId);
            const docSnap = await getDoc(leaveDocRef);
            if (!docSnap.exists()) return;

            let updatedLeaves = [...docSnap.data().leaves];

            updatedLeaves.splice(leaveToDelete.index, 1);

            if (updatedLeaves.length > 0) {
                await updateDoc(leaveDocRef, { leaves: updatedLeaves });
            } else {
                await deleteDoc(leaveDocRef);
            }

            fetchLeavesForManager();
        } catch (error) {
            console.error("Error deleting leave:", error);
        }
    };



    return (
        <>
            <NavbarTopbar />
            <div className="Employee_manager_leave_container mt-5">
                <h3 className="text-center mb-4">Employee Leave Requests</h3>

                {/* Filter dropdown */}
                <div className="filter-container mb-3 d-flex align-items-center">
                    <label htmlFor="roleFilter" className="me-2 fw-semibold">
                        Filter by Role:
                    </label>
                    <select
                        id="roleFilter"
                        className="form-select form-select-sm"
                        style={{ width: "150px" }}
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                    >
                        <option value="All">All</option>
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                    </select>
                </div>

                <div className="employeemanagerleave_table">
                    <table className="table table-hover table-bordered text-center employeemanagerleave-table">
                        <thead className="employeemanagerleave-table-head">
                            <tr>
                                <th>Employee Name</th>
                                <th>Badge ID</th>
                                <th>Department</th>
                                <th>Work Type</th>
                                <th>Shift</th>
                                <th>JobRole</th>
                                <th>Leave Type</th>
                                <th>From Date</th>
                                <th>To Date</th>
                                <th>Days</th>
                                <th>Status</th>
                                <th>Confirmation</th>
                                <th>Comment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="13" className="py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLeaveData.length > 0 ? (
                                filteredLeaveData.map((leave) => (
                                    <tr key={leave.docId + leave.index}>
                                        <td>{leave.firstName}</td>
                                        <td>{leave.badgeId}</td>
                                        <td>{leave.departments}</td>
                                        <td>{leave.workType || "-"}</td>
                                        <td>{leave.shift}</td>
                                        <td>{leave.jobRole}</td>
                                        <td>{leave.leaveType}</td>
                                        <td>{formatDate(leave.fromDate)}</td>
                                        <td>{formatDate(leave.toDate)}</td>
                                        <td>{leave.requestedDays}</td>
                                        <td>
                                            <span
                                                className={`status-badge-employee-manager-leave ${leave.status === "Accepted"
                                                        ? "accepted"
                                                        : leave.status === "Rejected"
                                                            ? "rejected"
                                                            : "pending"
                                                    }`}
                                            >
                                                {leave.status || "Pending"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex justify-content-center gap-2">
                                                {leave.jobRole === "Manager" ? (
                                                    leave.status === "Accepted" ? (
                                                        <button
                                                            className="btn btn-success btn-sm action-btn"
                                                            disabled
                                                            title="Leave already accepted"
                                                        >
                                                            Accepted
                                                        </button>
                                                    ) : leave.status === "Rejected" ? (
                                                        <button
                                                            className="btn btn-danger btn-sm action-btn"
                                                            disabled
                                                            title="Leave already rejected"
                                                        >
                                                            Rejected
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="btn btn-success btn-sm action-btn"
                                                                disabled
                                                                title="Pending leaves cannot be approved/rejected"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm action-btn"
                                                                disabled
                                                                title="Pending leaves cannot be approved/rejected"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )
                                                ) : (
                                                    // For Employees or others
                                                    <>
                                                        <button
                                                            className="btn btn-success btn-sm action-btn"
                                                            onClick={() => handleStatusChange(leave, "Accepted")}
                                                            disabled={leave.status === "Accepted"}
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm action-btn"
                                                            onClick={() => handleStatusChange(leave, "Rejected")}
                                                            disabled={leave.status === "Rejected"}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <button
                                                className="btn btn-outline-primary btn-sm comment-btn"
                                                onClick={() => openCommentModal(leave)}
                                                disabled={leave.status === "Pending"}
                                            >
                                                {leave.jobRole === "Manager" && leave.status === "Accepted"
                                                    ? "View Comment"
                                                    : leave.comment
                                                        ? "View Comment"
                                                        : "Add Comment"}
                                            </button>
                                            {leave.comment && (
                                                <div className="comment-preview mt-1">
                                                    {leave.comment.length > 20
                                                        ? `${leave.comment.substring(0, 20)}...`
                                                        : leave.comment}
                                                </div>
                                            )}
                                        </td>

                                        <td>

                                            <button
                                                className="btn employeemanagerleave-outline-danger btn-sm"
                                                onClick={() => handleDelete(leave)}
                                                title="Delete Leave"
                                            >
                                                <FaTrash />
                                            </button>

                                        </td>




                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="13" className="py-4 text-muted">
                                        No leave requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
                                <div className="mb-3">
                                    <label className="form-label">
                                        Comment for {selectedLeave?.employeeName}'s leave
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Write your comment here..."
                                        readOnly={isCommentReadOnly}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>

                                {selectedLeave?.jobRole === "Employee" && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={saveComment}
                                        disabled={isCommentReadOnly}
                                    >
                                        Save Comment
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Employee_manager_leave;
