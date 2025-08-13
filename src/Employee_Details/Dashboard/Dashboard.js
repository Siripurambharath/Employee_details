import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import {
  FaUserPlus, FaCalendarWeek, FaUsers, FaMale,
  FaFemale, FaBuilding, FaBirthdayCake, FaCalendarAlt
} from 'react-icons/fa';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Legend, Tooltip
} from 'recharts';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const Dashboard = () => {
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [departmentData, setDepartmentData] = useState([]);
  const [employeeStatusData, setEmployeeStatusData] = useState([]);
  const [birthdayUsers, setBirthdayUsers] = useState([]);
  const [anniversaryUsers, setAnniversaryUsers] = useState([]);
  const [showAllBirthdays, setShowAllBirthdays] = useState(false);
  const [showAllAnniversaries, setShowAllAnniversaries] = useState(false);

  const COLORS = ['#2196f3', '#e91e63', '#ff9800', '#ffeb3b', '#00bcd4', '#9c27b0'];

  useEffect(() => {
    fetchUserData();
    fetchDepartmentWiseCounts();
    fetchBirthdayAnniversaryAlerts();
  }, []);

  const fetchUserData = async () => {
    const usersSnapshot = await getDocs(collection(db, 'users'));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    let todayJoinings = 0;
    let weekJoinings = 0;
    let activeCount = 0;
    let inActiveCount = 0;
    let male = 0;
    let female = 0;

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      
      const joinDateString = data.joiningDate;
      if (joinDateString) {
        const joinDate = new Date(joinDateString);
        joinDate.setHours(0, 0, 0, 0);

        const isToday = joinDate.getDate() === today.getDate() && 
                       joinDate.getMonth() === today.getMonth();
        
        if (isToday) {
          todayJoinings++;
        }

        const joinDayOfWeek = joinDate.getDay();
        const todayDayOfWeek = today.getDay();
        const daysDiff = (joinDate.getDate() - joinDayOfWeek) - (today.getDate() - todayDayOfWeek);
        
        if (daysDiff >= 0 && daysDiff < 7) {
          weekJoinings++;
        }
      }

      const status = data?.status?.toLowerCase();
      if (status === 'active') activeCount++;
      else inActiveCount++;

      const gender = data?.gender?.toLowerCase();
      if (gender === 'male') male++;
      else if (gender === 'female') female++;
    });

    setTodayCount(todayJoinings);
    setWeekCount(weekJoinings);
    setTotalCount(usersSnapshot.size);
    setMaleCount(male);
    setFemaleCount(female);
    setEmployeeStatusData([
      { name: 'Active', value: activeCount },
      { name: 'In-Active', value: inActiveCount },
    ]);
  };


const fetchDepartmentWiseCounts = async () => {
  try {
    const departmentsSnapshot = await getDocs(collection(db, 'departments'));
    const usersSnapshot = await getDocs(collection(db, 'users'));

    // Initialize department map with departments collection
    const departmentMap = {};
    departmentsSnapshot.forEach((doc) => {
      const deptName = (doc.data().name || '').trim();
      const key = deptName.toLowerCase();
      departmentMap[key] = { name: deptName, value: 0 };
    });

    // Count users department-wise
    usersSnapshot.forEach((doc) => {
      const user = doc.data();

      // Fix: Check plural field name also
      const rawDept = user.departments || user.department || user.workInfo?.department || '';
      const cleanDept = rawDept.trim().toLowerCase();

      if (departmentMap[cleanDept]) {
        departmentMap[cleanDept].value += 1;
      } else if (cleanDept) {
        // If user has a department not in departments collection, add dynamically
        departmentMap[cleanDept] = { name: rawDept.trim(), value: 1 };
      }
    });

    const pieData = Object.values(departmentMap);


    setDepartmentData(pieData);
    setDepartmentCount(Object.keys(departmentMap).length);
  } catch (error) {
    console.error('❌ Error fetching department-wise counts:', error);
  }
};



  const fetchBirthdayAnniversaryAlerts = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today); 
    nextWeek.setDate(today.getDate() + 7);

    let bdays = [], anns = [];

    snapshot.forEach((doc) => {
      const user = doc.data();
      const badgeId = user.badgeId || doc.id;
      const firstName = user.firstName || 'NoName';
      const lastName = user.lastName || '';

      // Process birthday
      if (user.dob || user.personalInfo?.dob) {
        const dobStr = user.dob || user.personalInfo.dob;
        const dob = new Date(dobStr);
        
        // Create date for this year
        const dobThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        
        if (dobThisYear >= today && dobThisYear <= nextWeek) {
          const daysUntil = Math.ceil((dobThisYear - today) / (1000 * 60 * 60 * 24));
          bdays.push({ 
            badgeId, 
            firstName,
            lastName,
            date: dobThisYear,
            daysUntil,
            type: 'birthday'
          });
        }
      }

      // Process work anniversary
      const joinDateStr = user?.workInfo?.joiningDate || user.joiningDate;
      if (joinDateStr) {
        const joinDate = new Date(joinDateStr);
        
        // Create date for this year
        const annivThisYear = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
        
        if (annivThisYear >= today && annivThisYear <= nextWeek) {
          const daysUntil = Math.ceil((annivThisYear - today) / (1000 * 60 * 60 * 24));
          anns.push({ 
            badgeId, 
            firstName,
            lastName,
            date: annivThisYear,
            daysUntil,
            type: 'anniversary'
          });
        }
      }
    });

    // Sort by date (soonest first)
    bdays.sort((a, b) => a.daysUntil - b.daysUntil);
    anns.sort((a, b) => a.daysUntil - b.daysUntil);

    setBirthdayUsers(bdays);
    setAnniversaryUsers(anns);
  };

  return (
    <>
      <NavbarTopbar />
      <div className="db-container mt-4">
        <h2 className="db-title">Dashboard</h2>

        <div className="db-stats-grid">
          <div className="db-stat-card db-today">
            <FaUserPlus className="db-stat-icon" />
            <div className="db-stat-content">
              <h3>New Joinings Today</h3>
              <p>{todayCount}</p>
            </div>
          </div>
          
          <div className="db-stat-card db-week">
            <FaCalendarWeek className="db-stat-icon" />
            <div className="db-stat-content">
              <h3>This Week</h3>
              <p>{weekCount}</p>
            </div>
          </div>
          
          <div className="db-stat-card db-total">
            <FaUsers className="db-stat-icon" />
            <div className="db-stat-content">
              <h3>Total Members</h3>
              <p>{totalCount}</p>
              <div className="db-gender-count">
                <span className="db-male-count"><FaMale /> {maleCount}</span>
                <span className="db-female-count"><FaFemale /> {femaleCount}</span>
              </div>
            </div>
          </div>
          
          <div className="db-stat-card db-dept">
            <FaBuilding className="db-stat-icon" />
            <div className="db-stat-content">
              <h3>Total Departments</h3>
              <p>{departmentCount}</p>
            </div>
          </div>
        </div>

        <div className="db-charts-container">
          <div className="db-chart-card">
            <h4 className="db-chart-title">Employees Status</h4>
            <div className="db-chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={employeeStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60}>
                    {employeeStatusData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="db-chart-card">
            <h4 className="db-chart-title">Department Distribution</h4>
            <div className="db-chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={departmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60}>
                    {departmentData.map((entry, i) => (
                      <Cell key={`cell-dept-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="db-events-container">
          <div className="db-event-section db-birthdays">
            <div className="db-event-header">
              <FaBirthdayCake className="db-event-icon" />
              <h3>Birthdays ({birthdayUsers.length})</h3>
            </div>
            {birthdayUsers.length > 0 ? (
              <>
                <div className="db-event-users">
                  {(showAllBirthdays ? birthdayUsers : birthdayUsers.slice(0, 3)).map((user, i) => (
                    <div key={i} className="db-user-card">
                      <span className="db-user-badge">{user.badgeId}</span>
                      <span className="db-user-name">{user.firstName} {user.lastName}</span>
                      <span className="db-user-date">
                        ({user.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - 
                        {user.daysUntil === 0 ? 'Today' : `in ${user.daysUntil} day${user.daysUntil !== 1 ? 's' : ''}`})
                      </span>
                    </div>
                  ))}
                </div>
                {birthdayUsers.length > 3 && (
                  <button 
                    className="db-view-more"
                    onClick={() => setShowAllBirthdays(!showAllBirthdays)}
                  >
                    {showAllBirthdays ? 'Show Less' : `View All (${birthdayUsers.length})`}
                  </button>
                )}
              </>
            ) : (
              <p className="db-no-events">No upcoming birthdays</p>
            )}
          </div>

          <div className="db-event-section db-anniversaries">
            <div className="db-event-header">
              <FaCalendarAlt className="db-event-icon" />
              <h3>Anniversaries ({anniversaryUsers.length})</h3>
            </div>
            {anniversaryUsers.length > 0 ? (
              <>
                <div className="db-event-users">
                  {(showAllAnniversaries ? anniversaryUsers : anniversaryUsers.slice(0, 3)).map((user, i) => (
                    <div key={i} className="db-user-card">
                      <span className="db-user-badge">{user.badgeId}</span>
                      <span className="db-user-name">{user.firstName} {user.lastName}</span>
                      <span className="db-user-date">
                        ({user.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - 
                        {user.daysUntil === 0 ? 'Today' : `in ${user.daysUntil} day${user.daysUntil !== 1 ? 's' : ''}`})
                      </span>
                    </div>
                  ))}
                </div>
                {anniversaryUsers.length > 3 && (
                  <button 
                    className="db-view-more"
                    onClick={() => setShowAllAnniversaries(!showAllAnniversaries)}
                  >
                    {showAllAnniversaries ? 'Show Less' : `View All (${anniversaryUsers.length})`}
                  </button>
                )}
              </>
            ) : (
              <p className="db-no-events">No upcoming anniversaries</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;