import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Addleave.css";
import NavbarTopbar from "../../Navbar/NavbarTopbar";
import { db, auth } from "../../Firebase/Firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  arrayUnion,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Add_leave = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [appliedLeaves, setAppliedLeaves] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [departments, setDepartments] = useState("");
  const [workType, setWorkType] = useState("");
  const [shift, setShift] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [reportingManager, setReportingManager] = useState("");
  const [reason, setReason] = useState("");
  const [selectedType, setSelectedType] = useState({ id: "", name: "" });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [requestedDays, setRequestedDays] = useState(0);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setEmail(user.email);

        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setFirstName(data.firstName || "");
          setBadgeId(data.badgeId || "");
          setDepartments(data.departments || "");
          setWorkType(data.workType || "");
          setShift(data.shift || "");
          setJobRole(data.jobRole || "");
          setReportingManager(data.reportingManager || "");
        }

        const leaveDoc = await getDoc(doc(db, "addleave", user.uid));
        if (leaveDoc.exists()) {
          setAppliedLeaves(leaveDoc.data().leaves || []);
        }
      }
    });

    const fetchLeaveTypes = async () => {
      const snapshot = await getDocs(collection(db, "leavetypes"));
      const leaves = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLeaveTypes(leaves);
    };
    fetchLeaveTypes();

    return () => unsubscribe();
  }, []);

  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    const diff =
      Math.floor((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleDateChange = (type, value) => {
    if (type === "from") setFromDate(value);
    if (type === "to") setToDate(value);
    const start = type === "from" ? value : fromDate;
    const end = type === "to" ? value : toDate;
    setRequestedDays(calculateDays(start, end));
  };

 const getUsedDays = (typeId) =>
  appliedLeaves
    .filter(
      (leave) => leave.leaveTypeId === typeId && leave.status?.toLowerCase() === "approved"
    )
    .reduce((sum, leave) => sum + (leave.requestedDays || 0), 0);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedType.id || !fromDate || !toDate || !reason) {
      alert("Please fill all required fields");
      return;
    }

    if (requestedDays <= 0) {
      alert("Invalid leave duration.");
      return;
    }

    const leaveInfo = leaveTypes.find((lt) => lt.id === selectedType.id);
    const usedDays = getUsedDays(selectedType.id);

    if (
      leaveInfo &&
      leaveInfo.totalDays !== 0 &&
      usedDays + requestedDays > leaveInfo.totalDays
    ) {
      alert(
        `You only have ${leaveInfo.totalDays - usedDays} ${selectedType.name} days left.`
      );
      return;
    }

    try {
      if (!reportingManager) {
        alert("Reporting Manager info missing!");
        return;
      }

      const managerMatch = reportingManager.match(/(.*)\s+\((.*)\)/);
      if (!managerMatch) {
        alert("Invalid Reporting Manager format. Expected 'Name (BADGEID)'");
        return;
      }

      const managerName = managerMatch[1].trim();
      const managerBadgeId = managerMatch[2].trim();

      const managerQuery = query(
        collection(db, "users"),
        where("badgeId", "==", managerBadgeId)
      );
      const managerSnapshot = await getDocs(managerQuery);
      if (managerSnapshot.empty) {
        alert("Reporting manager not found!");
        return;
      }

      const managerDoc = managerSnapshot.docs[0];
      const managerData = managerDoc.data();

      const leaveId = Date.now().toString(); // ✅ Unique leave ID
      const leaveData = {
        leaveId,
        firstName,
        badgeId,
        email,
        uid: userId,
        departments,
        workType,
        shift,
        leaveType: selectedType.name,
        leaveTypeId: selectedType.id,
        jobRole,
        reportingManager: {
          uid: managerDoc.id,
          display: `${managerName} (${managerBadgeId})`,
          badgeId: managerBadgeId,
          firstName: managerName,
          email: managerData.email,
        },
        fromDate,
        toDate,
        requestedDays,
        reason,
        status: "pending",
        comment: "",
        appliedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "addleave", userId),
        { leaves: arrayUnion(leaveData) },
        { merge: true }
      );

      // send email
      await fetch("http://localhost:5001/send-leave-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...leaveData }),
      });

      alert("Leave submitted successfully!");
      navigate("/employeeleave");
    } catch (error) {
      console.error(error);
      alert("Error submitting leave.");
    }
  };

  return (
    <>
      <NavbarTopbar />
      <div className="container add-leave-container mt-4">
        {/* Leave Type Cards */}
        <div className="leaves-types-cards-scroll">
          {leaveTypes.map((leave) => {
            const used = getUsedDays(leave.id);
            const total = leave.totalDays === 0 ? "Unlimited" : leave.totalDays;
            const completed = leave.totalDays !== 0 && used >= leave.totalDays;
            return (
              <div
                className={`leave-card ${
                  leave.type === "Paid" ? "paid-border" : "unpaid-border"
                }`}
                key={leave.id}
              >
                <div className="leave-card-header">
                  <h4>{leave.name}</h4>
                  {completed && <span className="completed-badge">Completed</span>}
                </div>
                <div className="leave-card-footer">
                  <div className="footer-section">
                    <p className="footer-label">Payment</p>
                    <p className="footer-value">{leave.type}</p>
                  </div>
                  <div className="footer-section">
                    <p className="footer-label">Used / Total</p>
                    <p className="footer-value">
                      {used} / {total}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leave Form */}
        <div className="leave-form-page">
          <form className="add-leave-form" onSubmit={handleSubmit}>
            <h4 className="add-leave-title">Add Leave</h4>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Employee Name</label>
                <input className="form-control" value={firstName} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label>Badge ID</label>
                <input className="form-control" value={badgeId} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label>Department</label>
                <input className="form-control" value={departments} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label>Work Type</label>
                <input className="form-control" value={workType} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label>Shift</label>
                <input className="form-control" value={shift} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label>Leave Type</label>
                <select
                  className="form-select"
                  value={selectedType.id}
                  onChange={(e) => {
                    const obj = leaveTypes.find((lt) => lt.id === e.target.value);
                    if (obj) setSelectedType({ id: obj.id, name: obj.name });
                  }}
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label>From Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>To Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Requested Days</label>
                <input className="form-control" value={requestedDays} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label>Email</label>
                <input className="form-control" value={email} readOnly />
              </div>
              <div className="col-12 mb-3">
                <label>Reason</label>
                <textarea
                  className="form-control"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Submit Leave
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Add_leave;
