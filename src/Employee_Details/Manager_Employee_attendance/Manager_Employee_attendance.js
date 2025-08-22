import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaTrash } from "react-icons/fa";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { auth, db } from "../Firebase/Firebase";
import { doc, getDoc, updateDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./Manager_Employee_attendance.css";
import * as XLSX from "xlsx";

const Manager_Employee_attendance = () => {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState("attendance");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const [filterType, setFilterType] = useState("all");
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  // Pagination state
  const [attendancePage, setAttendancePage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const rowsPerPage = 10;

const saveAttendance = async (uid, attendanceArray) => {
  const cleanAttendance = attendanceArray.map((item) => {
    const cleaned = {};
    Object.keys(item).forEach((key) => {
      cleaned[key] = item[key] === undefined ? "" : item[key]; // replace undefined
    });
    return cleaned;
  });

  const docRef = doc(db, "employeeattendance", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await updateDoc(docRef, { attendance: cleanAttendance });
  } else {
    await setDoc(docRef, { attendance: cleanAttendance });
  }
};


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserInfo(currentUser.uid);
        await fetchAttendance(currentUser.uid);
        checkIfAlreadyCheckedIn(currentUser.uid);
        markAbsentIfNoCheckIn(currentUser.uid);
      } else {
        setUser(null);
        setAttendance([]);
        setAllAttendance([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

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

  const fetchAllAttendance = async () => {
    const managerIdentifier = `${userInfo.firstName} (${userInfo.badgeId})`;
    const snapshot = await getDocs(collection(db, "users"));
    const allData = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        (data.reportingManager && data.reportingManager === managerIdentifier) ||
        docSnap.id === auth.currentUser.uid
      ) {
        allData.push({
          uid: docSnap.id,
          firstName: data.firstName,
          badgeId: data.badgeId,
          jobRole: data.jobRole,
          departments: data.departments,
        });
      }
    });

    const attendanceData = [];
    for (const emp of allData) {
      const attendanceDoc = await getDoc(doc(db, "employeeattendance", emp.uid));
      if (attendanceDoc.exists()) {
        attendanceData.push({
          ...emp,
          attendance: attendanceDoc.data().attendance || []
        });
      }
    }

    setAllAttendance(attendanceData);
  };

  useEffect(() => {
    if (user && userInfo.firstName && userInfo.badgeId) {
      fetchAllAttendance();
    }
  }, [user, userInfo]);

  const toggleEmployeeSelection = (uid) => {
    setSelectedEmployees(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const exportSelectedToExcel = () => {
    const selectedData = allAttendance.filter(emp => selectedEmployees.includes(emp.uid));
    const rows = selectedData.map(emp => {
      const recordObj = {};
      recordObj["Name"] = `${emp.firstName} (${emp.badgeId})`;
      emp.attendance.forEach(item => {
        const dateObj = new Date(item.date);
        const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1)
          .toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
        recordObj[dateStr] = item.status || (item.checkIn ? "P" : "A");
      });
      return recordObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, "Selected_Attendance.xlsx");
  };

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

  const markAbsentIfNoCheckIn = async (uid) => {
    const today = new Date().toISOString().split("T")[0];
    const docRef = doc(db, "employeeattendance", uid);
    const docSnap = await getDoc(docRef);

    let attendanceArray = [];
    if (docSnap.exists()) {
      attendanceArray = docSnap.data().attendance || [];
    }

    const todayRecord = attendanceArray.find(a => a.date === today);
    if (!todayRecord) {
      attendanceArray.push({
        date: today,
        checkIn: "",
        checkOut: "",
        status: "Absent",
        departments: userInfo.departments,
        shift: userInfo.shift,
        workType: userInfo.workType,
        reportingManager: userInfo.reportingManager,
        jobRole: userInfo.jobRole,
      });
      await saveAttendance(uid, attendanceArray);
      fetchAttendance(uid);
    }
  };

  const handleCheckInOut = async () => {
    if (!user) return;

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const docRef = doc(db, "employeeattendance", user.uid);
    const docSnap = await getDoc(docRef);

    const userData = {
      firstName: userInfo.firstName || "Unknown",
      badgeId: userInfo.badgeId || "",
      departments: userInfo.departments || "General",
      shift: userInfo.shift || "Morning",
      workType: userInfo.workType || "On-Site",
      reportingManager: userInfo.reportingManager || "",
      jobRole: userInfo.jobRole || "",
    };

    let attendanceArray = [];
    if (docSnap.exists()) {
      attendanceArray = docSnap.data().attendance || [];
    }

    let todayIndex = attendanceArray.findIndex(item => item.date === dateStr);

    if (!isRunning) {
      // Check-In
      if (todayIndex === -1) {
        attendanceArray.push({
          date: dateStr,
          checkIn: timeStr,
          checkOut: "",
          status: "Pending",
          ...userData
        });
        await saveAttendance(user.uid, attendanceArray);
        setIsRunning(true);
        setSeconds(0);
        fetchAttendance(user.uid);
      } else {
        if (!attendanceArray[todayIndex].checkIn) {
          attendanceArray[todayIndex].checkIn = timeStr;
          attendanceArray[todayIndex].status = "Pending";
          await saveAttendance(user.uid, attendanceArray);
          setIsRunning(true);
          setSeconds(0);
          fetchAttendance(user.uid);
        }
      }
    } else {
      // Check-Out
      if (todayIndex !== -1 && !attendanceArray[todayIndex].checkOut) {
        const checkInTime = attendanceArray[todayIndex].checkIn || timeStr;
        const diffMs = now - new Date(`${dateStr} ${checkInTime}`);
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);

        attendanceArray[todayIndex].checkOut = timeStr;
        attendanceArray[todayIndex].overtime = `${diffHrs} hr ${diffMins} min`;
        attendanceArray[todayIndex].status = "Present";

        await saveAttendance(user.uid, attendanceArray);
        setIsRunning(false);
        fetchAttendance(user.uid);
      } else {
        setIsRunning(false);
      }
    }
  };

  const handleDelete = async (date) => {
    if (!user) return;
    const docRef = doc(db, "employeeattendance", user.uid);
    const docSnap = await getDoc(docRef);

    let attendanceArray = [];
    if (docSnap.exists()) {
      attendanceArray = docSnap.data().attendance || [];
    }

    const updatedAttendance = attendanceArray.filter(item => item.date !== date);
    await saveAttendance(user.uid, updatedAttendance);
    fetchAttendance(user.uid);
  };

  const formatTimer = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Slice data for pagination
  const attendanceToShow = attendance.slice(
    (attendancePage - 1) * rowsPerPage,
    attendancePage * rowsPerPage
  );

  const filteredReport = allAttendance.filter((emp) => {
    if (filterType === "manager") return emp.jobRole?.toLowerCase() === "manager";
    if (filterType === "employee") return emp.jobRole?.toLowerCase() !== "manager";
    return true;
  });

  const reportToShow = filteredReport.slice(
    (reportPage - 1) * rowsPerPage,
    reportPage * rowsPerPage
  );
  return (
    <>
      <NavbarTopbar />
 

      <div className="container mt-4 manager-attendance-page">
        <h2 className="manager-employee-attendance-title">Attendance</h2>
        <div className="manager-employee-attendance-buttons mb-4">
          <button className={activeTab === "attendance" ? "active" : "inactive"} onClick={() => setActiveTab("attendance")}>Attendance</button>
          <button className={activeTab === "report" ? "active" : "inactive"} onClick={() => setActiveTab("report")}>Attendance Report</button>
        </div>

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="card mb-4">
            <div className="card-body">
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

              <div className="table-responsive">
                <table className="table table-hover text-center">
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
                    {attendanceToShow.length > 0 ? attendanceToShow.map((row, index) => (
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
                          <button className="manageremployee-attendance-delete" onClick={() => handleDelete(row.date)}>
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="9" className="text-center py-4 text-muted">No attendance records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Attendance Pagination */}
              <div className="d-flex justify-content-end gap-2 mt-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  disabled={attendancePage === 1}
                  onClick={() => setAttendancePage(attendancePage - 1)}
                >
                  &lt;
                </button>
                <span>{attendancePage}</span>
                <button
                  className="btn btn-sm btn-outline-primary"
                  disabled={attendancePage * rowsPerPage >= attendance.length}
                  onClick={() => setAttendancePage(attendancePage + 1)}
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Tab */}
        {activeTab === "report" && (
          <div className="card-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex gap-2">
                  <select
                    className="form-select employee-attendance-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, idx) => (
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

                <div className="d-flex gap-2">
                  <select
                    className="manager-employee-attendance-select-filter"
                    value={filterType || "all"}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="manager">Me</option>
                    <option value="employee">Employees</option>
                  </select>

                  <button
                    className={`manager-employee-attendance-select-all ${selectedEmployees.length === allAttendance.map(emp => emp.uid).length
                        ? "deselect"
                        : "select"
                      }`}
                    onClick={() => {
                      if (selectedEmployees.length === allAttendance.map(emp => emp.uid).length) {
                        setSelectedEmployees([]);
                      } else {
                        setSelectedEmployees(allAttendance.map(emp => emp.uid));
                      }
                    }}
                  >
                    {selectedEmployees.length === allAttendance.map(emp => emp.uid).length ? "Deselect All" : "Select All"}
                  </button>


                  <button className="manager-employee-attendance-export" onClick={exportSelectedToExcel}>
                    Export
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered text-center monthly-attendance-table">
           <thead className="manager-employee-attendance-head">
  <tr>
    <th></th>
    <th>Name</th>
    {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => (
      <th key={i + 1}>{i + 1}</th>
    ))}
    <th>Total Presents</th>
    <th>Total Absents</th> {/* ✅ Add this */}
  </tr>
</thead>

              <tbody>
  {reportToShow.length > 0
    ? reportToShow.map((emp, idx) => {
        const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();

        const totalPresents = emp.attendance.filter((item) => {
          const dateObj = new Date(item.date);
          return (
            dateObj.getMonth() + 1 === Number(selectedMonth) &&
            dateObj.getFullYear() === Number(selectedYear) &&
            item.checkIn
          );
        }).length;

        const totalAbsents = totalDays - totalPresents;

        return (
          <tr key={idx}>
            <td>
              <input
                type="checkbox"
                checked={selectedEmployees.includes(emp.uid)}
                onChange={() => toggleEmployeeSelection(emp.uid)}
              />
            </td>
            <td>{emp.firstName} ({emp.badgeId})</td>
            {Array.from({ length: totalDays }, (_, i) => {
              const day = i + 1;
              const record = emp.attendance.find((item) => {
                const dateObj = new Date(item.date);
                return (
                  dateObj.getDate() === day &&
                  dateObj.getMonth() + 1 === Number(selectedMonth) &&
                  dateObj.getFullYear() === Number(selectedYear)
                );
              });
              return (
                <td
                  key={day}
                  className={record?.checkIn ? "attendance-present" : "attendance-absent"}
                >
                  {record?.checkIn ? "P" : "A"}
                </td>
              );
            })}
            <td>{totalPresents}</td>
            <td>{totalAbsents}</td> 
          </tr>
        );
      })
    : (
      <tr>
        <td
          colSpan={new Date(selectedYear, selectedMonth, 0).getDate() + 3}
          className="text-center text-muted"
        >
          No employees found under you
        </td>
      </tr>
    )}
</tbody>

                </table>
              </div>

              {/* Report Pagination */}
              <div className="d-flex justify-content-end gap-2 mt-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  disabled={reportPage === 1}
                  onClick={() => setReportPage(reportPage - 1)}
                >
                  &lt;
                </button>
                <span>{reportPage}</span>
                <button
                  className="btn btn-sm btn-outline-primary"
                  disabled={reportPage * rowsPerPage >= filteredReport.length}
                  onClick={() => setReportPage(reportPage + 1)}
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Manager_Employee_attendance;
