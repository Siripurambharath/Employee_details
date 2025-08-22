import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaTrash } from "react-icons/fa";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { auth, db } from "../Firebase/Firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./EmployeeAttendance.css";

const EmployeeAttendance = () => {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState("attendance");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Pagination states
  const [currentPageAttendance, setCurrentPageAttendance] = useState(1);
  const rowsPerPageAttendance = 10;

  // Fetch user info and attendance on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserInfo(currentUser.uid);
        await fetchAttendance(currentUser.uid);
        checkIfAlreadyCheckedIn(currentUser.uid);
      } else {
        setUser(null);
        setAttendance([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Timer for ongoing work
  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  // Fetch user info from Firestore
  const fetchUserInfo = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserInfo({
        firstName: data.firstName || "Unknown",
        badgeId: data.badgeId || "",
        departments: data.departments || "General",
        workType: data.workType || "On-Site",
        shift: data.shift || "Morning",
        reportingManager: data.reportingManager || "",
        jobRole: data.jobRole || "",
      });
    }
  };

  // Fetch attendance records from Firestore
  const fetchAttendance = async (uid) => {
    const docRef = doc(db, "employeeattendance", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const sortedAttendance = (data.attendance || []).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setAttendance(sortedAttendance);
    } else {
      setAttendance([]);
    }
  };

  // Check if user already checked in today
  const checkIfAlreadyCheckedIn = async (uid) => {
    const docRef = doc(db, "employeeattendance", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const today = new Date().toISOString().split("T")[0];
      const todayRecord = (data.attendance || []).find(
        (item) => item.date === today && !item.checkOut
      );

      if (todayRecord) {
        setIsRunning(true);
        const checkInTime = new Date(`${todayRecord.date} ${todayRecord.checkIn}`);
        const diffSec = Math.floor((new Date() - checkInTime) / 1000);
        setSeconds(diffSec > 0 ? diffSec : 0);
      }
    }
  };

  // ✅ Handle Check-In / Check-Out with Status
  const handleCheckInOut = async () => {
    if (!user) return;

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const docRef = doc(db, "employeeattendance", user.uid);
    let docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        uid: user.uid,
        ...userInfo,
        attendance: [],
      });
      docSnap = await getDoc(docRef);
    }

    const data = docSnap.data();
    const attendanceArray = data.attendance || [];

    // Find the last record for today without checkOut
    const lastTodayIndex = [...attendanceArray]
      .reverse()
      .findIndex((a) => a.date === dateStr && a.checkOut === "");

    if (lastTodayIndex === -1) {
      // ✅ New Check-In → Pending
      const newEntry = {
        date: dateStr,
        checkIn: timeStr,
        checkOut: "",
        overtime: "",
        status: "Pending",
        ...userInfo,
      };
      attendanceArray.push(newEntry);
      await updateDoc(docRef, { attendance: attendanceArray });
      setIsRunning(true);
      setSeconds(0);
      alert("Checked in successfully!");
    } else {
      // ✅ Existing Check-In → Update to Present
      const todayIndex = attendanceArray.length - 1 - lastTodayIndex;
      const checkInTime = new Date(`${attendanceArray[todayIndex].date} ${attendanceArray[todayIndex].checkIn}`);
      const diffMs = now - checkInTime;
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);

      attendanceArray[todayIndex].checkOut = timeStr;
      attendanceArray[todayIndex].overtime = `${diffHrs} hr ${diffMins} min`;
      attendanceArray[todayIndex].status = "Present";

      await updateDoc(docRef, { attendance: attendanceArray });
      setIsRunning(false);
      setSeconds(0);
      alert("Checked out successfully!");
    }

    fetchAttendance(user.uid);
  };

  // Delete attendance record
  const handleDelete = async (uid, index) => {
    const confirmed = window.confirm("Are you sure you want to delete this attendance record?");
    if (!confirmed) return;

    const docRef = doc(db, "employeeattendance", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const attendanceArray = data.attendance || [];
      attendanceArray.splice(index, 1); // Remove the record by index
      await updateDoc(docRef, { attendance: attendanceArray });
      fetchAttendance(uid);
    }
  };

  // Format timer for display
  const formatTimer = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Generate monthly report
  const generateMonthlyReport = () => {
    const monthData = attendance.filter((item) => {
      const date = new Date(item.date);
      return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
    });

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    let report = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const record = monthData.find((item) => item.date === dayStr);
      report.push({
        date: dayStr,
        status: record ? record.status || "Present" : "Absent",
        checkIn: record?.checkIn || "-",
        checkOut: record?.checkOut || "-",
      });
    }
    return report;
  };

  const monthlyReport = generateMonthlyReport();
  const totalPresent = monthlyReport.filter((r) => r.status === "Present").length;
  const totalAbsent = monthlyReport.filter((r) => r.status === "Absent").length;
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Pagination calculations
  const indexOfLastRow = currentPageAttendance * rowsPerPageAttendance;
  const indexOfFirstRow = indexOfLastRow - rowsPerPageAttendance;
  const currentAttendanceRows = attendance.slice(indexOfFirstRow, indexOfLastRow);
  const totalPagesAttendance = Math.ceil(attendance.length / rowsPerPageAttendance);

  return (
    <>
      <NavbarTopbar />
      <div className="container mt-4">
        <div className="employee-attendance-title">Attendance</div>

        {/* Tab buttons */}
        <div className="employee-attendance-buttons">
          <div className="btn-group" role="group">
            <button
              className={`employee-attendance-tab-btn ${activeTab === "attendance" ? "active" : "inactive"}`}
              onClick={() => setActiveTab("attendance")}
            >
              Attendance
            </button>
            <button
              className={`employee-attendance-tab-btn ${activeTab === "report" ? "active" : "inactive"}`}
              onClick={() => setActiveTab("report")}
            >
              Monthly Report
            </button>
          </div>
        </div>

        {/* Month & Year selector for report */}
        {activeTab === "report" && (
          <div className="employee-attendance-month-year d-flex gap-2 mb-3">
            <select
              className="form-select employee-attendance-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {[...Array(12)].map((_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {new Date(0, idx).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>

            <select
              className="form-select employee-attendance-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="employee-attendance-container">
            <div className="d-flex justify-content-center mb-4">
              <button
                className={`btn btn-sm ${isRunning ? "btn-danger" : "btn-success"}`}
                onClick={handleCheckInOut}
              >
                {isRunning ? (
                  <>
                    <span className="d-block" style={{ fontSize: "0.8rem" }}>Check Out</span>
                    <span className="d-block" style={{ fontSize: "0.8rem" }}>{formatTimer(seconds)}</span>
                  </>
                ) : (
                  <span style={{ fontSize: "1.1rem" }}>Check In</span>
                )}
              </button>
            </div>

            <div className="card-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="employee-attendance-head">
                      <tr>
                        <th>S.No</th>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Date</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                    
                        <th>Shift</th>
                        <th>Work Type</th>
                        <th>Overtime</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAttendanceRows.length > 0 ? (
                        currentAttendanceRows.map((row, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{userInfo.firstName}</td>
                            <td>{row.departments}</td>
                            <td>{new Date(row.date).toLocaleDateString("en-GB")}</td>
                            <td>{row.checkIn}</td>
                            <td>{row.checkOut || "-"}</td>
                            <td>{row.shift}</td>
                            <td>{row.workType}</td>
                            <td>{row.overtime || "-"}</td>
                            <td>
                              <button
                                className="employeeattendance-delete"
                                onClick={() => handleDelete(user.uid, index)}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="11" className="text-center py-4 text-muted">
                            No attendance records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination controls */}
                {attendance.length > 0 && (
                  <div className="d-flex justify-content-end mt-3 gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      disabled={currentPageAttendance === 1}
                      onClick={() => setCurrentPageAttendance(prev => prev - 1)}
                    >
                      &lt;
                    </button>
                    <span>{currentPageAttendance} / {totalPagesAttendance}</span>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      disabled={currentPageAttendance === totalPagesAttendance}
                      onClick={() => setCurrentPageAttendance(prev => prev + 1)}
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Monthly Report Tab */}
        {activeTab === "report" && (
          <div className="employee-attendance-report-container">
            <div className="card-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                 <table className="table table-bordered mb-0 text-center">
  <thead className="employee-attendance-head">
    <tr>
      <th>Name</th> {/* ✅ Add Name column */}
      {Array.from({ length: daysInMonth }, (_, i) => (
        <th key={i}>{i + 1}</th>
      ))}
      <th>Total Present</th>
      <th>Total Absent</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{userInfo.firstName} ({userInfo.badgeId})</td> {/* ✅ Show name + badgeId */}
      {Array.from({ length: daysInMonth }, (_, i) => {
        const dayStr = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-${(i + 1).toString().padStart(2, "0")}`;
        const record = attendance.find((item) => item.date === dayStr);
        return (
          <td key={i}>
            {record ? (
              record.status === "Present" ? (
                <span className="present">P</span>
              ) : (
                <span className="pending">Pending</span>
              )
            ) : (
              <span className="absent">A</span>
            )}
          </td>
        );
      })}
      <td><strong>{totalPresent}</strong></td>
      <td><strong>{totalAbsent}</strong></td>
    </tr>
  </tbody>
</table>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EmployeeAttendance;
