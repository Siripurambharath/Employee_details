import React, { useEffect, useState } from 'react';
import { FaEllipsisV, FaUserCircle, FaBell } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, setDoc,getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import './Employees.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { 
 where,
  query, 
  orderBy, 
  limit,
  writeBatch 
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import NavbarTopbar from '../Navbar/NavbarTopbar';



const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [badgeFilter, setBadgeFilter] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [allDepartments, setAllDepartments] = useState([]);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [upcomingAlerts, setUpcomingAlerts] = useState([]);

  const navigate = useNavigate();
  const userEmail = localStorage.getItem('email');
  const badgeId = localStorage.getItem('badgeId');
  const isAdmin = userEmail === 'admin@gmail.com';

  const fetchDepartmentsFromDB = async () => {
    try {
      const filterSnap = await getDocs(collection(db, 'departments'));
      const deptList = filterSnap.docs
        .map(doc => doc.data().name)
        .filter(name => name && name.trim() !== '');
      setAllDepartments(deptList);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

 const isWithinNext7Days = (date, today = new Date()) => {
  if (!date) return false;
  
  // Create dates at midnight to compare just days
  const todayAtMidnight = new Date(today);
  todayAtMidnight.setHours(0, 0, 0, 0);
  
  const nextWeek = new Date(todayAtMidnight);
  nextWeek.setDate(todayAtMidnight.getDate() + 7);
  
  const eventDate = new Date(date);
  eventDate.setFullYear(todayAtMidnight.getFullYear()); // Use current year
  eventDate.setHours(0, 0, 0, 0);
  
  return eventDate >= todayAtMidnight && eventDate <= nextWeek;
};

const fetchEmployees = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const usersList = querySnapshot.docs.map(doc => ({
      id: doc.id, 
      ...doc.data(),
      departments: doc.data().departments || doc.data().workInfo?.departments || 'No departments',
      status: doc.data().status || 'active'
    }));

    if (isAdmin) {
      setEmployees(usersList);
      setFilteredEmployees(usersList);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = usersList.filter(emp => {
        // Get dates from all possible fields
        const dob = emp.dob || emp.personalInfo?.dob;
        const joiningDate = emp.joiningDate || emp.workInfo?.joiningDate;
        
        // Check if either date falls within next 7 days
        return (dob && isWithinNext7Days(dob, today)) || 
               (joiningDate && isWithinNext7Days(joiningDate, today));
      }).map(emp => {
        const dob = emp.dob || emp.personalInfo?.dob;
        const joiningDate = emp.joiningDate || emp.workInfo?.joiningDate;
        
        const getDaysUntil = (date) => {
          if (!date) return 0;
          const eventDate = new Date(date);
          eventDate.setFullYear(today.getFullYear());
          return Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
        };

        return {
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          badgeId: emp.badgeId || emp.id,
          birthday: dob && isWithinNext7Days(dob, today) ? 
            new Date(dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null,
          anniversary: joiningDate && isWithinNext7Days(joiningDate, today) ? 
            new Date(joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null,
          daysUntil: dob && isWithinNext7Days(dob, today) ? 
            getDaysUntil(dob) : getDaysUntil(joiningDate)
        };
      });

      setUpcomingAlerts(upcoming);
    } else {
      const matchedUser = usersList.find(emp => emp.badgeId === badgeId || emp.id === badgeId);
      setEmployees(matchedUser ? [matchedUser] : []);
      setFilteredEmployees(matchedUser ? [matchedUser] : []);
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
  }
};

  useEffect(() => {
    fetchDepartmentsFromDB();
    fetchEmployees();
  }, [badgeId, userEmail]);

  useEffect(() => {
    const filtered = employees.filter(emp => {
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
      const badge = (emp.badgeId || '').toLowerCase();
      
      const matchesSearch = fullName.includes(searchText.toLowerCase());
      const matchesDept = selectedDept ? (emp.departments || '').toLowerCase() === selectedDept.toLowerCase() : true;
      const matchesBadge = badgeFilter ? badge.includes(badgeFilter.toLowerCase()) : true;
      
      return matchesSearch && matchesDept && matchesBadge;
    });

    setFilteredEmployees(filtered);
  }, [searchText, selectedDept, badgeFilter, employees]);

  const toggleDropdown = (empId) => {
    setOpenDropdownId(prev => (prev === empId ? null : empId));
  };



const handleDelete = async (id) => {
  if (window.confirm("Are you sure you want to delete this employee?")) {
    try {
      const employeeToDelete = employees.find(emp => emp.id === id);
      if (!employeeToDelete) {
        console.warn("❗ Employee not found:", id);
        return;
      }

      

      // 1. Delete Firestore User Document
      await deleteDoc(doc(db, "users", id));

      // 2. Delete Authentication User
      if (employeeToDelete?.email) {
        try {
          const deleteAuthUser = httpsCallable(getFunctions(), "deleteAuthUser");
          await deleteAuthUser({ email: employeeToDelete.email });
        
        } catch (authError) {
          console.error("❌ Auth user deletion failed:", authError);
        }
      }

      // 3. Delete Badge ID by querying for badgeId field
      if (employeeToDelete?.badgeId) {
        try {
          console.log("🔖 Attempting to delete badgeId:", employeeToDelete.badgeId);
          const badgeQuery = query(
            collection(db, "badgeIds"),
            where("badgeId", "==", employeeToDelete.badgeId)
          );
          const badgeSnapshot = await getDocs(badgeQuery);

          badgeSnapshot.forEach(async (badgeDoc) => {
            await deleteDoc(doc(db, "badgeIds", badgeDoc.id));
           
          });

        } catch (badgeError) {
          console.error("❌ Badge deletion failed:", badgeError);
        }
      }

      // 4. Update state
      const updatedList = employees.filter(emp => emp.id !== id);
      setEmployees(updatedList);
      setFilteredEmployees(updatedList);

    } catch (error) {
      console.error("❌ Employee deletion failed:", error);
    }
  }
};



const handleDeleteAll = async () => {
  if (window.confirm("Are you sure you want to delete all employees?")) {
    try {
      const deleteAuthUser = httpsCallable(getFunctions(), "deleteAuthUser");

      const deletePromises = employees.map(async (emp) => {
        console.log("🧹 Deleting employee:", emp);

        // 1. Delete user document from Firestore
        await deleteDoc(doc(db, "users", emp.id));
       

        // 2. Delete auth user
        if (emp?.email) {
          try {
            await deleteAuthUser({ email: emp.email });
            
          } catch (authError) {
            console.error("❌ Auth delete failed for", emp.email, authError);
          }
        }

        // 3. Delete badge document by querying badgeId field
        if (emp?.badgeId) {
          try {
            console.log("🔖 Deleting badgeId:", emp.badgeId);
            const badgeQuery = query(
              collection(db, "badgeIds"),
              where("badgeId", "==", emp.badgeId)
            );
            const badgeSnapshot = await getDocs(badgeQuery);

            badgeSnapshot.forEach(async (badgeDoc) => {
              await deleteDoc(doc(db, "badgeIds", badgeDoc.id));
          
            });

          } catch (badgeError) {
            console.error("❌ Badge deletion failed:", emp.badgeId, badgeError);
          }
        }
      });

      await Promise.all(deletePromises);

      // 4. Clear state
      setEmployees([]);
      setFilteredEmployees([]);
      console.log("✅ All employees deleted.");

    } catch (error) {
      console.error("❌ Failed to delete all employees:", error);
    }
  }
};




  const toggleEmployeeStatus = async (employeeId) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;

      const newStatus = employee.status === 'active' ? 'inactive' : 'active';
      
      const employeeRef = doc(db, 'users', employeeId);
      await updateDoc(employeeRef, { status: newStatus });

      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? { ...emp, status: newStatus } : emp
      ));
      setFilteredEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? { ...emp, status: newStatus } : emp
      ));
    } catch (error) {
      console.error("Error updating employee status:", error);
    }
  };

  const handleExport = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        delete data.workInfo;
        delete data.bankInfo;
        delete data.created_at;
        delete data.updated_at;
        return { id: doc.id, ...data };
      });

      const ws = XLSX.utils.json_to_sheet(users);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Users');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'Users_Export.xlsx');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { 
        FirstName: '', 
        LastName: '', 
        Email: '', 
        BadgeID: '', 
        Departments: '', 
        Status: 'active',
        DOB: 'DD/MM/YYYY',
        JoiningDate: 'DD/MM/YYYY'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'Employee_Import_Template.xlsx');
  };



const handleImportFile = async () => {
  if (!importFile) return alert('Please select a file!');

  const auth = getAuth();
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      // Read and parse Excel file
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);

      // Get the highest existing badgeId
      const usersRef = collection(db, "users");
      const badgeIdsRef = collection(db, "badgeIds");
      const q = query(usersRef, orderBy("badgeId", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      
      let lastBadgeNumber = 0;
      if (!querySnapshot.empty) {
        const lastBadgeId = querySnapshot.docs[0].data().badgeId;
        lastBadgeNumber = parseInt(lastBadgeId.replace("BADGE", "")) || 0;
      }

      const batch = writeBatch(db);
      let importedCount = 0;
      let authErrors = 0;
      
      for (const item of parsedData) {
        try {
          // Validate required fields
          if (!item.email) {
            console.warn("Skipping record - missing email");
            continue;
          }

          // Determine badgeId
          let badgeId = item.badgeId;
          if (!badgeId) {
            lastBadgeNumber++;
            badgeId = `BADGE${lastBadgeNumber}`;
          }

          // Check if user already exists by email (alternative check)
          const emailCheckQuery = query(usersRef, where("email", "==", item.email));
          const emailCheckSnapshot = await getDocs(emailCheckQuery);
          if (!emailCheckSnapshot.empty) {
            console.log(`User with email ${item.email} already exists, skipping`);
            continue;
          }

          // Create auth user first to get UID
          let uid;
          try {
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              item.email,
              item.password || `${badgeId}@${item.email.split('@')[0]}`
            );
            uid = userCredential.user.uid;
          } catch (authError) {
            console.error(`Auth error for ${item.email}:`, authError);
            authErrors++;
            continue;
          }

          // Prepare user data with UID as document ID
          const userData = {
            // Personal Info
            firstName: item.firstName || '',
            lastName: item.lastName || '',
            dob: item.dob || '',
            gender: item.gender || '',
            phone: item.phone || '',
            email: item.email,
            maritalStatus: item.maritalStatus || '',
            address: item.address || '',
            city: item.city || '',
            state: item.state || '',
            emergencyContactName: item.emergencyContactName || '',
            emergencyContactNumber: item.emergencyContactNumber || '',
            emergencyContactRelation: item.emergencyContactRelation || '',

            // Work Info
            badgeId: badgeId,
            workEmail: item.workEmail || item.email,
            workPhone: item.workPhone || '',
            departments: item.departments || '',
            jobPosition: item.jobPosition || '',
            jobRole: item.jobRole || '',
            reportingManager: item.reportingManager || '',
            workLocation: item.workLocation || '',
            workType: item.workType || '',
            employmentType: item.employmentType || '',
            joiningDate: item.joiningDate || new Date().toISOString().split('T')[0],
            endingDate: item.endingDate || '',
            shift: item.shift || '',
            basicSalary: item.basicSalary || '',
            status: item.status || 'active',
            employeeTag: item.employeeTag || '',
            experience: item.experience || '',
            qualifications: item.qualifications || '',

            // Bank Info
            accountNumber: item.accountNumber || '',
            bankName: item.bankName || '',
            branch: item.branch || '',
            ifsc: item.ifsc || '',

            // System Fields
            uid: uid, // Store UID in document data
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const userDocRef = doc(db, "users", uid);
          batch.set(userDocRef, userData);
          
          const badgeDocRef = doc(badgeIdsRef, uid); 
          batch.set(badgeDocRef, {
            badgeId: badgeId,
            userId: uid,
            assignedTo: `${userData.firstName} ${userData.lastName}`,
            assignedDate: new Date().toISOString(),
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          importedCount++;

        } catch (error) {
          console.error(`Error processing record:`, error);
          continue;
        }
      }

      // Commit all Firestore writes
      if (importedCount > 0) {
        await batch.commit();
      }

      // Show results
      let message = `Successfully imported ${importedCount} users!`;
      if (authErrors > 0) {
        message += ` (${authErrors} authentication errors - check console)`;
      }
      alert(message);
      fetchEmployees();

    } catch (error) {
      console.error("Error importing data:", error);
      alert("Error importing data. Please check the console for details.");
    } finally {
      setShowImportModal(false);
      setImportFile(null);
    }
  };
  
  reader.readAsArrayBuffer(importFile);
};

  const handleClearAlerts = () => {
    setUpcomingAlerts([]);
  };

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedDept('');
    setBadgeFilter('');
  };

  return (
    <>
      <NavbarTopbar />
    

  <div className="employee-main-container container-fluid">
  <div className="d-flex justify-content-between align-items-center mb-4">
    <h3 className="employee-main-header-title">{isAdmin ? 'All Employees' : 'My Profile'}</h3>
    {isAdmin && (
      <div className="d-flex align-items-center gap-3">
        {upcomingAlerts.length > 0 && (
          <span className="position-relative">
            <Button
              variant="outline-warning"
              onClick={() => setShowNotifications(true)}
              className="d-flex align-items-center gap-2 position-relative"
            >
              <FaBell />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {upcomingAlerts.length}
              </span>
            </Button>
          </span>
        )}
        <Link to="/addemployee" className="btn btn-danger">
          + Create Employee
        </Link>
      </div>
    )}
  </div>

  <div className="employee-main-filter-controls bg-white p-3 rounded shadow-sm mb-4">
    <div className="row g-3 align-items-center">
      <div className="col-md-3">
        <Form.Control
          type="text"
          placeholder="Search by name"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <div className="col-md-2">
        <Form.Select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {allDepartments.map((dept, index) => (
            <option key={index} value={dept}>{dept}</option>
          ))}
        </Form.Select>
      </div>
      <div className="col-md-2">
        <Form.Control
          type="text"
          placeholder="Filter by badge ID"
          value={badgeFilter}
          onChange={(e) => setBadgeFilter(e.target.value)}
        />
      </div>
      <div className="col-md-2">
        <Button
          variant="outline-secondary"
          onClick={clearAllFilters}
          className="w-100"
        >
          Clear All
        </Button>
      </div>
      {isAdmin && (
        <div className="col-md-3">
          <div className="dropdown d-flex">
            <Button
              variant="primary"
              onClick={() => setShowActionDropdown(!showActionDropdown)}
              className="flex-grow-1"
            >
              Bulk Actions
            </Button>
            {showActionDropdown && (
              <div className="dropdown-menu show" style={{ position: 'absolute', inset: '0px auto auto 0px', margin: '0px', transform: 'translate(0px, 40px)' }}>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowImportModal(true);
                    setShowActionDropdown(false);
                  }}
                >
                  Import Employees
                </button>
                <button
                  className="dropdown-item"
                  onClick={handleExport}
                >
                  Export Employees
                </button>
                <button
                  className="dropdown-item text-danger"
                  onClick={handleDeleteAll}
                >
                  Delete All Employees
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>

  {filteredEmployees.length > 0 ? (
    <div className="row g-4">
      {filteredEmployees.map(emp => (
        <div className="col-md-6 col-lg-4" key={emp.id}>
          <div
            className={`employee-main-card card h-100 ${emp.status === 'inactive' ? 'inactive-employee' : ''}`}
            onClick={() => navigate(`/about/${emp.badgeId || emp.id}`)}
          >
            <div className="card-body position-relative">
              <div className="dropdown position-absolute top-0 end-0">
                <button
                  className="btn btn-sm btn-light rounded-circle"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(emp.id);
                  }}
                >
                  <FaEllipsisV />
                </button>
                {openDropdownId === emp.id && (
                  <div className="dropdown-menu show position-absolute end-0">
                    <Link className="dropdown-item" to={`/about/${emp.badgeId || emp.id}`}>View Profile</Link>
                    <Link className="dropdown-item" to={`/Editaddemployee/${emp.badgeId || emp.id}`} onClick={(e) => e.stopPropagation()}>Edit Profile</Link>
                    {isAdmin && (
                      <button className="dropdown-item" onClick={(e) => {
                        e.stopPropagation();
                        toggleEmployeeStatus(emp.id);
                        setOpenDropdownId(null);
                      }}>
                        {emp.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
                      </button>
                    )}
                    {isAdmin && (
                      <button className="dropdown-item text-danger" onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(emp.id);
                      }}>
                        Delete Employee
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="d-flex align-items-center gap-3">
                <div className="employee-main-avatar">
                  <FaUserCircle size={40} />
                </div>
                <div className="flex-grow-1">
                  <h5 className="mb-1">
                    {emp.firstName || 'No Name'} {emp.lastName || ''}
                    {emp.status === 'inactive' && (
                      <span className="badge bg-danger ms-2">Inactive</span>
                    )}
                  </h5>
                  <div className="text-muted small mb-1">
                    <span className="fw-medium">Badge ID:</span> {emp.badgeId || 'N/A'}
                  </div>
                  <div className="text-muted small mb-1">
                    <span className="fw-medium">Email:</span> {emp.email || 'No Email'}
                  </div>
                  <div className="text-muted small mb-2">
                    <span className="fw-medium">Dept:</span> {emp.departments || 'No departments'}
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span className={`employee-main-status-dot ${emp.status === 'active' ? 'bg-success' : 'bg-secondary'}`} />
                    <small className="text-muted">
                      {emp.status ? emp.status.charAt(0).toUpperCase() + emp.status.slice(1) : 'Offline'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-5 bg-white rounded shadow-sm">
      <h4 className="text-muted">No employees match your criteria</h4>
      <Button variant="outline-primary" onClick={clearAllFilters} className="mt-3">
        Clear Filters
      </Button>
    </div>
  )}
</div>


      {/* Import Modal */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Import Employees</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h5>Download Template</h5>
            <p className="text-muted small">
              Download our template file to ensure proper formatting
            </p>
            <Button 
              variant="outline-primary" 
              onClick={handleDownloadTemplate}
              className="w-100"
            >
              Download Excel Template
            </Button>
          </div>
          
          <Form.Group>
            <Form.Label>Upload Employee Data</Form.Label>
            <Form.Control 
              type="file" 
              accept=".xlsx" 
              onChange={(e) => setImportFile(e.target.files[0])} 
            />
            <Form.Text className="text-muted">
              Only .xlsx files are accepted. Ensure dates are in DD/MM/YYYY format.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowImportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImportFile}>
            Import Employees
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Notification Modal */}
      <Modal show={showNotifications} onHide={() => setShowNotifications(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaBell className="me-2" />
            Upcoming Events (Next 7 Days)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {upcomingAlerts.length > 0 ? (
            <div className="list-group">
              {upcomingAlerts.map((alert, index) => (
                <div key={index} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">{alert.name}</h6>
                      <small className="text-muted">Badge ID: {alert.badgeId}</small>
                    </div>
                    <div className="badge bg-primary rounded-pill">
                      {alert.daysUntil} {alert.daysUntil === 1 ? 'day' : 'days'} left
                    </div>
                  </div>
                  {alert.birthday && (
                    <div className="mt-2 d-flex align-items-center">
                      <span className="me-2">🎂</span>
                      <span>Birthday on {alert.birthday}</span>
                    </div>
                  )}
                  {alert.anniversary && (
                    <div className="mt-2 d-flex align-items-center">
                      <span className="me-2">🎉</span>
                      <span>Work Anniversary on {alert.anniversary}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <h5 className="text-muted">No upcoming events</h5>
              <p>There are no birthdays or anniversaries in the next 7 days</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowNotifications(false)}>
            Close
          </Button>
          {upcomingAlerts.length > 0 && (
            <Button variant="outline-danger" onClick={handleClearAlerts}>
              Clear All
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Employees;