// src/Employee_Details/Payroll.js
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { db } from '../Firebase/Firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  arrayUnion,
} from 'firebase/firestore';
import './Payroll.css';
import { useNavigate } from 'react-router-dom';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const Payroll = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [employee, setEmployee] = useState(null);
  const [payDate, setPayDate] = useState(new Date());
  const [attendanceDays, setAttendanceDays] = useState(0);
  const [presentDates, setPresentDates] = useState([]);
  const [paidLeaves, setPaidLeaves] = useState(0);
  const [unpaidLeaves, setUnpaidLeaves] = useState(0);
  const [totalRequestedDays, setTotalRequestedDays] = useState(0);
  const perDaySalary = 500;
  const [approvedLeavesCount, setApprovedLeavesCount] = useState(0);


const [form, setForm] = useState({
  allowances: '',
  deductions: '',
  bonus: '',       // <-- Add this
  paymentMethod: '',
  status: '',
  bankName: '',
  ifscCode: '',
  branchName: '',
});


  const [netSalary, setNetSalary] = useState(0);

  const formatDateWithDashes = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const parseAttendanceDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  // 🔹 Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const userList = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setUsers(userList);
    };
    fetchUsers();
  }, []);

  // 🔹 Select employee
  useEffect(() => {
    const emp = users.find((u) => u.badgeId === selectedBadgeId);
    setEmployee(emp);
    if (emp) {
      setForm((prev) => ({
        ...prev,
        bankName: emp.bankName || '',
        ifscCode: emp.ifsc || '',
        branchName: emp.branch || '',
      }));
    }
  }, [selectedBadgeId, users]);

  // 🔹 Fetch attendance and leave data
// 🔹 Fetch attendance and leave data
useEffect(() => {
  const fetchAttendanceAndLeaves = async () => {
    if (!employee) return;

    try {
      // Attendance (unchanged)
      const attRef = collection(db, 'employeeattendance');
      const snapshot = await getDocs(attRef);
      const selectedMonth = payDate.getMonth();
      const selectedYear = payDate.getFullYear();
      const attendanceRecords = snapshot.docs.map((doc) => doc.data());

      const empAttendance = attendanceRecords.flatMap((rec) => {
        if (rec.badgeId !== employee.badgeId) return [];
        if (!rec.attendance || !Array.isArray(rec.attendance)) return [];

        return rec.attendance
          .filter((a) => {
            const attDate = parseAttendanceDate(a.date);
            return (
              a.status === 'Present' &&
              attDate.getMonth() === selectedMonth &&
              attDate.getFullYear() === selectedYear
            );
          })
          .map((a) => a.date);
      });

      setAttendanceDays(empAttendance.length);
      setPresentDates(empAttendance);

      // Leave calculation - FIXED
      const leaveRef = collection(db, 'addleave');
      const leaveSnap = await getDocs(leaveRef);
      
      const typeSnap = await getDocs(collection(db, 'leavetypes'));
      const leaveTypes = {};
      typeSnap.forEach((t) => {
        const data = t.data();
        leaveTypes[t.id] = data;
      });

      let totalPaid = 0;
let totalUnpaid = 0;
let totalRequested = 0;
let approvedCount = 0; // <-- add this

leaveSnap.forEach((docSnap) => {
  const leaveDoc = docSnap.data();
  if (!leaveDoc.leaves || !Array.isArray(leaveDoc.leaves)) return;

  leaveDoc.leaves.forEach((leave) => {
    if (leave.badgeId !== employee.badgeId) return;

    // Count approved leaves
    if ((leave.status || '').toLowerCase() === 'approved') approvedCount++;

    if ((leave.status || '').toLowerCase() !== 'approved') return;

    const leaveType = leaveTypes[leave.leaveTypeId];
    if (!leaveType) return;

    const leaveStart = parseAttendanceDate(leave.fromDate || leave.startDate);
    const leaveEnd = parseAttendanceDate(leave.toDate || leave.endDate);

    if (
      leaveStart && leaveEnd && (
        (leaveStart.getMonth() === selectedMonth && leaveStart.getFullYear() === selectedYear) ||
        (leaveEnd.getMonth() === selectedMonth && leaveEnd.getFullYear() === selectedYear)
      )
    ) {
      const usedDays = leave.requestedDays || 0;
      totalRequested += usedDays;

      if (leaveType.type && leaveType.type.toLowerCase() === 'unpaid') {
        totalUnpaid += usedDays;
      } else {
        totalPaid += usedDays;
      }
    }
  });
});

setPaidLeaves(totalPaid);
setUnpaidLeaves(totalUnpaid);
setTotalRequestedDays(totalRequested);
setApprovedLeavesCount(approvedCount); // <-- store approved leaves count

    } catch (err) {
      console.error('Error fetching attendance/leaves:', err);
    }
  };

  fetchAttendanceAndLeaves();
}, [employee, payDate]);

  // 🔹 Net Salary
useEffect(() => {
  if (employee) {
    const calculatedSalary = (attendanceDays + paidLeaves - unpaidLeaves) * perDaySalary;
    const net =
      Number(calculatedSalary) +
      Number(form.allowances || 0) +
      Number(form.bonus || 0) -    // <-- add bonus here
      Number(form.deductions || 0);
    setNetSalary(net);
  }
}, [form.allowances, form.deductions, form.bonus, employee, attendanceDays, paidLeaves, unpaidLeaves]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Handle Generate Payslip
  const handleGenerate = async () => {
    if (!employee) return alert('Please select an employee.');

    // Calculate attendance records with full info
    const attendanceRecordsForMonth = presentDates.map((dateStr) => {
      const d = parseAttendanceDate(dateStr);
      return {
        date: formatDateWithDashes(d),
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        status: 'Present',
      };
    });

    // Fetch leave details for this employee
    const leaveRef = collection(db, 'addleave');
    const leaveSnap = await getDocs(leaveRef);

    const typeSnap = await getDocs(collection(db, 'leavetypes'));
    const leaveTypes = {};
    typeSnap.forEach((t) => {
      const data = t.data();
      leaveTypes[t.id] = data;
    });

    let paidLeaveRecords = [];
    let unpaidLeaveRecords = [];

    leaveSnap.forEach((docSnap) => {
      const leave = docSnap.data();
      if (!leave || leave.badgeId !== employee.badgeId) return;
      if ((leave.status || '').toLowerCase() !== 'approved') return;

      const leaveType = leaveTypes[leave.leaveTypeId];
      if (!leaveType) return;

      const usedDays = leave.requestedDays || 0;
      const leaveData = {
        leaveType: leaveType.type,
        days: usedDays,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason || '',
      };

      if (leaveType.type && leaveType.type.toLowerCase() === 'unpaid') {
        unpaidLeaveRecords.push(leaveData);
      } else {
        paidLeaveRecords.push(leaveData);
      }
    });
const calculatedSalary = (attendanceDays + paidLeaves - unpaidLeaves) * perDaySalary + Number(form.bonus || 0);

    const slip = {
      uid: employee.id || '',
      firstName: employee.firstName || '',
      departments: employee.departments || '',
      badgeId: employee.badgeId || '',
      email: employee.email || '',
      phone: employee.phone || '',
      jobPosition: employee.jobPosition || '',
      jobLevel: employee.jobLevel || '',
      jobRole: employee.jobRole || '',
        bonus: form.bonus || 0,  
          calculatedSalary: calculatedSalary,  

      reportingManager: employee.reportingManager || '',
      attendanceDays,
      attendanceRecords: attendanceRecordsForMonth,
      paidLeaves,
      unpaidLeaves,
      totalRequestedDays,
        approvedLeavesCount, 
        
      paidLeaveRecords,
      unpaidLeaveRecords,
      allowances: form.allowances || 0,
      deductions: form.deductions || 0,
      netSalary: netSalary || 0,
      paymentMethod: form.paymentMethod || '',
      status: form.status || '',
      bankName: form.bankName || '',
      ifsc: form.ifscCode || '',
      branchName: form.branchName || '',
      date: formatDateWithDashes(payDate),
      createdAt: new Date().toISOString(),
    };

    try {
      const payslipRef = doc(db, 'payslips', employee.id);
      await setDoc(payslipRef, { slips: arrayUnion(slip) }, { merge: true });
      alert('Payslip Generated & Stored Successfully!');
      navigate('/payslip');
    } catch (err) {
      console.error('Error saving payslip:', err);
    }
  };

  return (
    <>
      <NavbarTopbar />
      <div className="container py-4 mt-5">
        <div className="card shadow-lg p-4">
          <h3 className="text-center text-primary mb-4">Payroll Management</h3>

          {/* Employee Selector */}
          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label">Select Employee</label>
              <select
                className="form-select"
                value={selectedBadgeId}
                onChange={(e) => setSelectedBadgeId(e.target.value)}
              >
                <option value="">-- Select Employee --</option>
                {users.map((user) => (
                  <option key={user.badgeId} value={user.badgeId}>
                    {user.firstName} ({user.badgeId})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="payDate" className="form-label">
                Pay Date
              </label>
              <div className="input-group">
                  <i className="bi bi-calendar-event"></i>
                <DatePicker
                  id="payDate"
                  selected={payDate}
                  onChange={(date) => setPayDate(date)}
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select a date"
                  calendarClassName="custom-datepicker"
                />
              </div>
            </div>
          </div>

          {employee && (
            <>
              <hr />
              <h5 className="text-success mb-3">Employee Details</h5>
              <div className="row">
                <div className="col-md-4">
                  <strong>Name:</strong> {employee.firstName}
                </div>
                <div className="col-md-4">
                  <strong>Email:</strong> {employee.email}
                </div>
                <div className="col-md-4">
                  <strong>Phone:</strong> {employee.phone}
                </div>
                <div className="col-md-4">
                  <strong>Position:</strong> {employee.jobPosition}
                </div>
                <div className="col-md-4">
                  <strong>Level:</strong> {employee.jobLevel}
                </div>
                <div className="col-md-4">
                  <strong>Role:</strong> {employee.jobRole}
                </div>
                <div className="col-md-4">
                  <strong>Reporting Manager:</strong> {employee.reportingManager}
                </div>
              </div>

              <hr className="my-4" />
              <h5 className="text-success mb-3">Attendance & Leave Details</h5>
              <div className="row">
                <div className="col-md-3">
                  <strong>Days Present:</strong> {attendanceDays}
                </div>
                <div className="col-md-3">
                  <strong>Paid Leaves:</strong> {paidLeaves}
                </div>
                <div className="col-md-3">
                  <strong>Unpaid Leaves:</strong> {unpaidLeaves}
                </div>
                <div className="col-md-3">
                  <strong>Total Requested Leave Days:</strong> {totalRequestedDays}
                </div>
                </div>
                <div className='row'>
                <div className="col-md-3">
                  <strong>Per Day Salary:</strong> ₹{perDaySalary}
                </div>
                                <div className="col-md-3">

               <strong>Calculated Salary:</strong> ₹{(attendanceDays + paidLeaves - unpaidLeaves) * perDaySalary}
        </div>
<div className="col-md-3">
  <strong>Approved Leaves:</strong> {approvedLeavesCount}
</div>

              </div>

              <hr className="my-4" />
              <h5 className="text-success mb-3">Bank & Payment Info</h5>
              <div className="row">
                <div className="col-md-4">
                  <strong>Bank Name:</strong> {employee.bankName}
                </div>
                <div className="col-md-4">
                  <strong>Branch:</strong> {employee.branch}
                </div>
                <div className="col-md-4">
                  <strong>IFSC Code:</strong> {employee.ifsc}
                </div>
                <div className="col-md-6 mb-3 mt-3">
                  <label>Payment Method</label>
                  <select
                    name="paymentMethod"
                    className="form-select"
                    value={form.paymentMethod}
                    onChange={handleInputChange}
                  >
                    <option value="">Select</option>
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3 mt-3">
                  <label>Status</label>
                  <select
                    name="status"
                    className="form-select"
                    value={form.status}
                    onChange={handleInputChange}
                  >
                    <option value="">Select</option>
                    <option value="Pending">Pending</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              <hr className="my-4" />
              <h5 className="text-success mb-3">Salary Breakdown</h5>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label>Allowances</label>
                  <input
                    name="allowances"
                    className="form-control"
                    value={form.allowances}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label>Deductions</label>
                  <input
                    name="deductions"
                    className="form-control"
                    value={form.deductions}
                    onChange={handleInputChange}
                  />
                </div>
                </div>
                <div className='row'>
                              <div className="col-md-6 mb-3">
  <label>Bonus</label>
  <input
    name="bonus"
    className="form-control"
    value={form.bonus}
    onChange={handleInputChange}
  />
</div>

                <div className="col-md-6 mb-3">
                  <label>Net Salary</label>
                  <input className="form-control" value={netSalary} disabled />
                </div>
              </div>



              <div className="text-center">
                <button className="btn btn-primary px-5" onClick={handleGenerate}>
                  Generate Payslip
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Payroll;