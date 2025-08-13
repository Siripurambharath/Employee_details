import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaTrash } from "react-icons/fa";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { auth, db } from "../Firebase/Firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./ManagerAttendance.css";

const ManagerAttendance = () => {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    badgeId: "",
    departments: "",
    workType: "",
    shift: "",
    reportingManager: "",
    jobRole: "",
  });
  const [attendance, setAttendance] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

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
        (a, b) => new Date(b.date) - new Date(a.date) // Descending
      );
      setAttendance(sortedAttendance);
    } else {
      setAttendance([]);
    }
  };

  const checkIfAlreadyCheckedIn = async (uid) => {
    const docRef = doc(db, "employeeattendance", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const attendanceArray = data.attendance || [];
      if (attendanceArray.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const todayRecord = attendanceArray.find(
          (item) => item.date === today && !item.checkOut
        );
        if (todayRecord) {
          setIsRunning(true);
          const checkInTime = new Date(
            `${todayRecord.date} ${todayRecord.checkIn}`
          );
          const diffSec = Math.floor((new Date() - checkInTime) / 1000);
          setSeconds(diffSec > 0 ? diffSec : 0);
        }
      }
    }
  };

  const handleCheckInOut = async () => {
    if (!user) return;
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const docRef = doc(db, "employeeattendance", user.uid);
    const docSnap = await getDoc(docRef);

    if (!isRunning) {
      // --- Check-In ---
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        const attendanceArray = existingData.attendance || [];

        // Check if today's record exists
        const todayRecord = attendanceArray.find(
          (item) => item.date === dateStr
        );

        if (todayRecord) {
          if (todayRecord.checkOut) {
            alert("You have already checked in and out for today.");
            return;
          } else {
            alert("You are already checked in for today. Please check out first.");
            return;
          }
        }

        // Create new record for today
        const newEntry = {
          date: dateStr,
          checkIn: timeStr,
          checkOut: "",
          overtime: "",
          departments: userInfo.departments,
          shift: userInfo.shift,
          workType: userInfo.workType,
          reportingManager: userInfo.reportingManager,
          jobRole: userInfo.jobRole,
        };

        attendanceArray.push(newEntry);
        await updateDoc(docRef, { attendance: attendanceArray });
      } else {
        await setDoc(docRef, {
          uid: user.uid,
          firstName: userInfo.firstName,
          badgeId: userInfo.badgeId,
          departments: userInfo.departments,
          shift: userInfo.shift,
          workType: userInfo.workType,
          attendance: [
            {
              date: dateStr,
              checkIn: timeStr,
              checkOut: "",
              overtime: "",
              departments: userInfo.departments,
              shift: userInfo.shift,
              workType: userInfo.workType,
              reportingManager: userInfo.reportingManager,
              jobRole: userInfo.jobRole,
            },
          ],
        });
      }

      setIsRunning(true);
      setSeconds(0);
      fetchAttendance(user.uid);
    } else {
      // --- Check-Out ---
      const data = docSnap.data();
      const attendanceArray = data.attendance || [];
      const todayRecordIndex = attendanceArray.findIndex(
        (item) => item.date === dateStr && !item.checkOut
      );

      if (todayRecordIndex !== -1) {
        const checkInTime = new Date(
          `${attendanceArray[todayRecordIndex].date} ${attendanceArray[todayRecordIndex].checkIn}`
        );
        const diffMs = now - checkInTime;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);

        attendanceArray[todayRecordIndex].checkOut = timeStr;
        attendanceArray[todayRecordIndex].overtime = `${diffHrs} hr ${diffMins} min`;

        await updateDoc(docRef, { attendance: attendanceArray });
      }
      setIsRunning(false);
      fetchAttendance(user.uid);
    }
  };

  const handleDelete = async (index) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this attendance record?"
    );
    if (!confirmed) return;

    const docRef = doc(db, "employeeattendance", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const attendanceArray = data.attendance || [];
      attendanceArray.splice(index, 1);
      await updateDoc(docRef, { attendance: attendanceArray });
      fetchAttendance(user.uid);
    }
  };

  const formatTimer = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <NavbarTopbar />
      <div className="container employee-attendance-container mt-5">
        <h3 className="mb-4 text-center employee-attendance-title">
          Manager Attendance
        </h3>

        <div className="d-flex justify-content-center mb-2">
          <button
            className={`btn ${isRunning ? "btn-danger" : "btn-success"}`}
            onClick={handleCheckInOut}
          >
            {isRunning
              ? `Check Out (${formatTimer(seconds)})`
              : "Check In"}
          </button>
        </div>

        <div className="table-responsive employee-attendance-table-container">
          <table className="table table-hover align-middle text-center employee-attendance-table">
            <thead className="employee-attendance-head">
              <tr>
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
              {attendance.map((row, index) => (
                <tr key={index}>
                  <td>{userInfo.firstName}</td>
                  <td>{row.departments}</td>
                  <td>
                    {new Date(row.date).toLocaleDateString("en-GB")}
                  </td>
                  <td>{row.checkIn}</td>
                  <td>{row.checkOut}</td>
                  <td>{row.shift}</td>
                  <td>{row.workType}</td>
                  <td>{row.overtime}</td>
                  <td>
                    <FaTrash
                      className="text-danger"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleDelete(index)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ManagerAttendance;
