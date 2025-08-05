import React, { useEffect, useState } from "react";
import {
  FaUserCircle, FaEnvelope, FaPhone,
  FaCalendarAlt, FaBuilding, FaUserTie
} from "react-icons/fa";
import { NavLink, useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import './EmployeeDashboard.css';
import dayjs from "dayjs";

import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const InfoItem = ({ Icon, label, value }) => (
  <div className="contact-info-item">
    <Icon className="contact-icon" />
    <div className="contact-text">
      <span className="contact-label">{label}:</span>
      <span className="contact-value">{value || "N/A"}</span>
    </div>
  </div>
);

const EmployeeDashboard = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [reportingManager, setReportingManager] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      const q = query(collection(db, "users"), where("badgeId", "==", id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUser(userData);
        
        // Fetch reporting manager details if available
        if (userData.reportingManager) {
          const managerQuery = query(collection(db, "users"), where("badgeId", "==", userData.reportingManager));
          const managerSnapshot = await getDocs(managerQuery);
          if (!managerSnapshot.empty) {
            setReportingManager(managerSnapshot.docs[0].data());
          }
        }
      }
    };
    fetchUser();
  }, [id]);

  const getAnniversaryStatus = (date) => {
    if (!date) return "N/A";
    const anniv = dayjs(date);
    const thisYear = dayjs().year();
    const nextAnniv = anniv.year(thisYear).isBefore(dayjs())
      ? anniv.year(thisYear + 1)
      : anniv.year(thisYear);
    const diffMonths = nextAnniv.diff(dayjs(), "month");
    const diffDays = nextAnniv.diff(dayjs(), "day") % 30;
    return `${diffMonths} months ${diffDays} days left`;
  };

  // Pie Chart Data (static)
  const pieData = {
    labels: ["Present", "Absent", "Leave"],
    datasets: [{
      data: [20, 2, 3],
      backgroundColor: ["#4caf50", "#f44336", "#ff9800"],
      hoverBackgroundColor: ["#66bb6a", "#e57373", "#ffb74d"]
    }]
  };

  // Bar Chart Data (static week-wise attendance)
  const barData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      { 
        label: "Working Hours", 
        data: [40, 38, 42, 35], 
        backgroundColor: "#4caf50",
        borderRadius: 4
      }
    ]
  };
  
  const barOptions = { 
    responsive: true, 
    plugins: { 
      legend: { position: "top" },
      title: {
        display: true,
        text: 'Monthly Working Hours',
        font: { size: 14 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      }
    }
  };

  const pieOptions = {
    plugins: {
      title: {
        display: true,
        text: 'Monthly Attendance',
        font: { size: 14 }
      }
    }
  };

  // Performance & Tasks Table (static)
  const tasks = [
    { task: "Project A - Module 1", deadline: "2025-07-30", status: "In Progress", progress: 65 },
    { task: "Client Presentation", deadline: "2025-07-28", status: "Completed", progress: 100 },
    { task: "Code Review", deadline: "2025-07-27", status: "Pending", progress: 0 }
  ];

  return (
    <>
      <NavbarTopbar />
      <div className="employee-dashboard-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-left">
            <div className="profile-avatar"><FaUserCircle className="avatar-icon" /></div>
            <h2 className="profile-name">
              {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Loading..."}
            </h2>
            <div className="profile-id">Badge ID: <span>{user?.badgeId || "N/A"}</span></div>
         
          </div>
          <div className="profile-right">
            <div className="contact-column">
              <InfoItem Icon={FaEnvelope} label="Work Email" value={user?.workEmail} />
              <InfoItem Icon={FaEnvelope} label="Personal Email" value={user?.email} />
            </div>
            <div className="contact-column">
              <InfoItem Icon={FaPhone} label="Work Phone" value={user?.workPhone} />
              <InfoItem Icon={FaPhone} label="Personal Phone" value={user?.phone} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs-container">
          <nav className="profile-tabs">
            {["/about", "/attendance", "/leave", "/employeepayroll", "/employeedashboard"].map((path) => (
              <NavLink key={path} to={`${path}/${id}`}
                className={({ isActive }) => `profile-tab ${isActive ? "active" : ""}`}>
                {path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Info Cards */}
        <div className="employee-info-cards">
          <div className="info-card">
            <FaCalendarAlt className="info-card-icon" />
            <div>
              <h4>Joining Date</h4>
              <p>{user?.joiningDate ? dayjs(user.joiningDate).format("DD-MM-YYYY") : "N/A"}</p>
            </div>
          </div>
          <div className="info-card">
            <FaCalendarAlt className="info-card-icon" />
            <div>
              <h4>Birthday</h4>
              <p>{user?.dob ? dayjs(user.dob).format("DD-MM-YYYY") : "N/A"}</p>
            </div>
          </div>
          <div className="info-card">
            <FaCalendarAlt className="info-card-icon" />
            <div>
              <h4>Work Anniversary</h4>
              <p>{getAnniversaryStatus(user?.joiningDate)}</p>
            </div>
          </div>
          <div className="info-card">
            <FaBuilding className="info-card-icon" />
            <div>
              <h4>Department</h4>
              <p>{user?.departments || "N/A"}</p>
            </div>
          </div>
          </div>
      

        {/* Reporting Manager Card */}
        {reportingManager && (
          <div className="manager-card">
            <div className="manager-header">
              <FaUserTie className="manager-icon" />
              <h3>Reporting Manager</h3>
            </div>
            <div className="manager-details">
              <div className="manager-avatar">
                <FaUserCircle />
              </div>
              <div className="manager-info">
                <h4>{`${reportingManager.firstName} ${reportingManager.lastName}`}</h4>
                <p>{reportingManager.designation || "Manager"}</p>
                <div className="manager-contact">
                  <span><FaEnvelope /> {reportingManager.workEmail || "N/A"}</span>
                  <span><FaPhone /> {reportingManager.workPhone || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
   

        {/* Charts Row */}
        <div className="charts-row">
          <div className="chart-container">
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div className="chart-container">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Performance & Tasks Table */}
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
                      <span className={`status-badge ${t.status.toLowerCase().replace(' ', '-')}`}>
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

export default EmployeeDashboard;