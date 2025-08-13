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
  const [employeedepartmentss, setEmployeedepartmentss] = useState("");
  const [employeeWorkType, setEmployeeWorkType] = useState("");
  const [employeeShift, setEmployeeShift] = useState("");
  const [userId, setUserId] = useState("");
const [jobRole, setEmployeejobRole] = useState ("");
const [reportingManager, setEmployeereportingManager] = useState ("");


  const [selectedType, setSelectedType] = useState({ id: "", name: "" });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [requestedDays, setRequestedDays] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setFirstName(data.firstName || data.name || "");
          setBadgeId(data.badgeId || "");
          setEmployeedepartmentss(data.departments || "");
          setEmployeeWorkType(data.workType || "");
          setEmployeeShift(data.shift || "");
          setEmployeejobRole(data.jobRole || "");
          setEmployeereportingManager(data.reportingManager || "");
          
        }

        const leaveDoc = await getDocs(
          query(collection(db, "addleave"), where("__name__", "==", user.uid))
        );
        if (!leaveDoc.empty) {
          setAppliedLeaves(leaveDoc.docs[0].data().leaves || []);
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
    const start = new Date(from);
    const end = new Date(to);
    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleDateChange = (type, value) => {
    if (type === "from") setFromDate(value);
    if (type === "to") setToDate(value);

    const start = type === "from" ? value : fromDate;
    const end = type === "to" ? value : toDate;
    setRequestedDays(calculateDays(start, end));
  };

  const getUsedDays = (typeId) => {
    return appliedLeaves
      .filter((leave) => leave.leaveTypeId === typeId)
      .reduce((sum, leave) => sum + (leave.requestedDays || 0), 0);
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const leaveInfo = leaveTypes.find((lt) => lt.id === selectedType.id);
  const usedDays = getUsedDays(selectedType.id);

  if (leaveInfo && leaveInfo.totalDays !== 0 && usedDays >= leaveInfo.totalDays) {
    alert(`${selectedType.name} leave is already completed.`);
  }

  if (!selectedType.id || !fromDate || !toDate) {
    alert("Please fill all required fields");
    return;
  }

  const leaveData = {
    firstName,
    badgeId,
    departments: employeedepartmentss,
    workType: employeeWorkType,
    shift: employeeShift,
    leaveType: selectedType.name,
    leaveTypeId: selectedType.id,
    jobRole,
    reportingManager,
    fromDate,
    toDate,
    requestedDays,
    status: "Pending",
    appliedAt: new Date().toISOString(),
  };

  try {
    await setDoc(
      doc(db, "addleave", userId),
      { leaves: arrayUnion(leaveData) },
      { merge: true }
    );
    alert("Leave request submitted successfully!");
    setSelectedType({ id: "", name: "" });
    setFromDate("");
    setToDate("");
    setRequestedDays(0);

    navigate("/employeeleave");
  } catch (error) {
    console.error("Error saving leave data:", error);
    alert("Error submitting leave request");
  }
};


  return (
    <>
      <NavbarTopbar />
      <div className="container add-leave-container mt-4">
        <div className="leaves-types-cards-scroll">
          {leaveTypes.map((leave) => {
            const used = getUsedDays(leave.id);
            const total = leave.totalDays === 0 ? "Unlimited" : leave.totalDays;
            const completed =
              leave.totalDays !== 0 && used >= leave.totalDays;

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
                  <div className="leave-card-icon">{leave.icon}</div>
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

        <div className="leave-form-page">
          <form className="add-leave-form" onSubmit={handleSubmit}>
            <h4 className="add-leave-title">Add Leave</h4>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label add-leave-label">
                  Employee Name:
                </label>
                <input type="text" className="form-control" value={firstName} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label add-leave-label">BadgeId:</label>
                <input type="text" className="form-control" value={badgeId} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label add-leave-label">
                  Department:
                </label>
                <input type="text" className="form-control" value={employeedepartmentss} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label add-leave-label">Work Type:</label>
                <input type="text" className="form-control" value={employeeWorkType} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label add-leave-label">Shift:</label>
                <input type="text" className="form-control" value={employeeShift} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label add-leave-label">Leave Type:</label>
        <select
  className="form-select"
  value={selectedType.id}
  onChange={(e) => {
    const leaveObj = leaveTypes.find((lt) => lt.id === e.target.value);
    if (leaveObj) setSelectedType({ id: leaveObj.id, name: leaveObj.name });
  }}
>
  <option value="">Select Leave Type</option>
  {leaveTypes.map((type) => {
    const used = getUsedDays(type.id);
    const isCompleted = type.totalDays !== 0 && used >= type.totalDays;
    return (
      <option key={type.id} value={type.id}>
        {type.name} {isCompleted ? "(Completed)" : ""}
      </option>
    );
  })}
</select>

              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label add-leave-label">From Date:</label>
                <input
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label add-leave-label">To Date:</label>
                <input
                  type="date"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label add-leave-label">Requested Days:</label>
                <input type="number" className="form-control" value={requestedDays} readOnly />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-2">
              Submit Leave
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Add_leave;
