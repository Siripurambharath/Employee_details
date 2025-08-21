import React, { useEffect, useState } from "react";
import {
  FaEnvelope,
  FaPhone,
} from "react-icons/fa";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../Firebase/Firebase";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import "./ManagerDashboard.css";
import dayjs from "dayjs";

import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Managerdashboard = () => {
  const [user, setUser] = useState(null);
  const [reportingManager, setReportingManager] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [pieDate, setPieDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [barDate, setBarDate] = useState(dayjs().format("YYYY-MM-DD"));

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const q = query(
        collection(db, "users"),
        where("uid", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUser(userData);

        // Reporting Manager
        if (userData.reportingManager) {
          const match = userData.reportingManager.match(/\(([^)]+)\)/);
          const managerBadgeId = match ? match[1] : null;
          if (managerBadgeId) {
            const managerQuery = query(
              collection(db, "users"),
              where("badgeId", "==", managerBadgeId)
            );
            const managerSnapshot = await getDocs(managerQuery);
            if (!managerSnapshot.empty)
              setReportingManager(managerSnapshot.docs[0].data());
          }
        }

        // Attendance
        const attSnap = await getDocs(
          query(
            collection(db, "employeeattendance"),
            where("uid", "==", userData.uid)
          )
        );
        if (!attSnap.empty)
          setAttendanceData(attSnap.docs[0].data().attendance || []);

        // Leave
        const leaveSnap = await getDocs(
          query(collection(db, "addleave"), where("uid", "==", userData.uid))
        );
        if (!leaveSnap.empty) setLeaveData(leaveSnap.docs[0].data().leaves || []);
      }
    };
    fetchUser();
  }, []);

  // Pie chart data
  const getPieChartData = () => {
    const selected = dayjs(pieDate);
    let present = 0,
      absent = 0,
      leave = 0;

    attendanceData.forEach((a) => {
      const attDate = dayjs(a.date);
      if (
        attDate.year() === selected.year() &&
        attDate.month() === selected.month()
      ) {
        if (a.checkIn && a.checkOut) present++;
        else absent++;
      }
    });

    leaveData.forEach((l) => {
      const leaveDate = dayjs(l.date);
      if (
        leaveDate.year() === selected.year() &&
        leaveDate.month() === selected.month()
      )
        leave++;
    });

    return {
      labels: ["Present", "Absent", "Leave"],
      datasets: [
        {
          data: [present, absent, leave],
          backgroundColor: ["#4caf50", "#f44336", "#ff9800"],
          hoverBackgroundColor: ["#66bb6a", "#e57373", "#ffb74d"],
        },
      ],
    };
  };

  // Bar chart data
  const getBarChartData = () => {
    const selected = dayjs(barDate);
    const weeklyHours = [0, 0, 0, 0];

    attendanceData.forEach((a) => {
      if (!a.checkIn || !a.checkOut) return;
      const dateObj = dayjs(a.date);
      if (
        dateObj.year() !== selected.year() ||
        dateObj.month() !== selected.month()
      )
        return;

      const inTime = dayjs(`${a.date} ${a.checkIn}`);
      const outTime = dayjs(`${a.date} ${a.checkOut}`);
      const hoursWorked = outTime.diff(inTime, "hour", true);

      const weekOfMonth = Math.floor((dateObj.date() - 1) / 7);
      if (weekOfMonth >= 0 && weekOfMonth < 4)
        weeklyHours[weekOfMonth] += hoursWorked;
    });

    return {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [
        {
          label: "Working Hours",
          data: weeklyHours.map((h) => Math.round(h * 100) / 100),
          backgroundColor: "#4a6baf",
          borderRadius: 4,
        },
      ],
    };
  };

  const pieOptions = {
    plugins: { title: { display: true, text: "Monthly Attendance" } },
  };
  const barOptions = {
    responsive: true,
    plugins: { title: { display: true, text: "Monthly Working Hours" } },
  };

  const tasks = [
    {
      task: "Project A - Module 1",
      deadline: "2025-07-30",
      status: "In Progress",
      progress: 65,
    },
    {
      task: "Client Presentation",
      deadline: "2025-07-28",
      status: "Completed",
      progress: 100,
    },
    {
      task: "Code Review",
      deadline: "2025-07-27",
      status: "Pending",
      progress: 0,
    },
  ];

  return (
    <>
      <NavbarTopbar />
      <div className="Managerdashboard">
        <h2 className="dashboard-title">Employee Dashboard</h2>

        {reportingManager && (
          <div className="manager-card">
            <div className="manager-header">
              <h4>Reporting Manager</h4>
            </div>
            <div className="manager-details">
              <div className="manager-info">
                <h5>
                  {`${reportingManager.firstName} `}
                </h5>
                <p>{reportingManager.designation || "Manager"}</p>
                <div className="manager-contact">
                  <span>
                    <FaEnvelope /> {reportingManager.workEmail || "N/A"}
                  </span>
                  <span>
                    <FaPhone /> {reportingManager.workPhone || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="charts-row">
          <div className="chart-container-piechart">
            <div className="chart-header">
              <h4>Attendance</h4>
              <input
                type="month"
                value={pieDate.slice(0, 7)}
                onChange={(e) => setPieDate(e.target.value + "-01")}
              />
            </div>
<Pie
  className="piechart-Managerdashboard"
  data={getPieChartData()}
  options={pieOptions}
/>
          </div>
          <div className="chart-container-bargraph">
            <div className="chart-header">
              <h4>Working Hours</h4>
              <input
                type="month"
                value={barDate.slice(0, 7)}
                onChange={(e) => setBarDate(e.target.value + "-01")}
              />
            </div>
            <Bar data={getBarChartData()} options={barOptions} />
          </div>
        </div>

        {/* Performance Table */}
        <div className="performance-section">
          <h3>Performance & Tasks</h3>
          <div className="performance-table-container">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={i}>
                    <td>{t.task}</td>
                    <td>{dayjs(t.deadline).format("DD-MM-YYYY")}</td>
                    <td>
                      <span
                        className={`status-badge ${t.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${t.progress}%` }}
                        ></div>
                        <span className="progress-text">{t.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Managerdashboard;
