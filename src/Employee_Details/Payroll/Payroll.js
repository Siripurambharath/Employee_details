// src/Employee_Details/Payroll.js
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { db } from '../Firebase/Firebase';
import { collection, getDocs, doc, setDoc, arrayUnion } from 'firebase/firestore';
import './Payroll.css';
import { useNavigate } from 'react-router-dom';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const Payroll = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [employee, setEmployee] = useState(null);
  const [payDate, setPayDate] = useState(new Date());

  const [form, setForm] = useState({
    allowances: '',
    deductions: '',
    paymentMethod: '',
    status: '',
    bankName: '',
    ifscCode: '',
    branchName: '',
  });

  const [netSalary, setNetSalary] = useState(0);

  // Helper function to format date with dashes
  const formatDateWithDashes = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`; 
  };

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const userList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setUsers(userList);
    };
    fetchUsers();
  }, []);

  // When user selects employee
  useEffect(() => {
    const emp = users.find(u => u.badgeId === selectedBadgeId);
    setEmployee(emp);
    if (emp) {
      setForm(prev => ({
        ...prev,
        bankName: emp.bankName || '',
        ifscCode: emp.ifsc || '',
        branchName: emp.branch || '',
      }));
    }
  }, [selectedBadgeId, users]);

  // Calculate Net Salary
  useEffect(() => {
    if (employee) {
      const net =
        Number(employee.basicSalary || 0) +
        Number(form.allowances || 0) -
        Number(form.deductions || 0);
      setNetSalary(net);
    }
  }, [form.allowances, form.deductions, employee]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!employee) return alert('Please select an employee.');

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
        reportingManager: employee.reportingManager || '', 
      basicSalary: employee.basicSalary || 0,
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
      const payslipRef = doc(db, "payslips", employee.id);

      await setDoc(payslipRef, {
        slips: arrayUnion(slip)
      }, { merge: true });

      alert("Payslip Generated & Stored Successfully!");
      navigate("/payslip");
    } catch (err) {
      console.error("Error saving payslip:", err);
    }
  };

  return (
    <>
      <NavbarTopbar />
      <div className="container py-4 mt-5">
        <div className="card shadow-lg p-4">
          <h3 className="text-center text-primary mb-4">Payroll Management</h3>

          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label">Select Employee</label>
              <select
                className="form-select"
                value={selectedBadgeId}
                onChange={(e) => setSelectedBadgeId(e.target.value)}
              >
                <option value="">-- Select Employee --</option>
                {users.map(user => (
                  <option key={user.badgeId} value={user.badgeId}>
                    {user.firstName} ({user.badgeId})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="payDate" className="form-label">Pay Date</label>
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-calendar-event"></i>
                </span>
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
                <div className="col-md-4"><strong>Name:</strong> {employee.firstName}</div>
                <div className="col-md-4"><strong>Email:</strong> {employee.email}</div>
                <div className="col-md-4"><strong>Phone:</strong> {employee.phone}</div>
                <div className="col-md-4"><strong>Position:</strong> {employee.jobPosition}</div>
                <div className="col-md-4"><strong>Level:</strong> {employee.jobLevel}</div>
                <div className="col-md-4"><strong>Role:</strong> {employee.jobRole}</div>
                <div className="col-md-4"><strong>Reporting Manager:</strong> {employee.reportingManager}</div>
              </div>

              <hr className="my-4" />
              <h5 className="text-success mb-3">Bank & Payment Info</h5>
              <div className="row">
                <div className="col-md-4"><strong>Bank Name:</strong> {employee.bankName}</div>
                <div className="col-md-4"><strong>Branch:</strong> {employee.branch}</div>
                <div className="col-md-4"><strong>IFSC Code:</strong> {employee.ifsc}</div>
                <hr className="my-4" />
                <div className="col-md-6 mb-3">
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

                <div className="col-md-6 mb-3">
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
                  <label>Basic Salary</label>
                  <input className="form-control" value={employee.basicSalary || 0} disabled />
                </div>
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
