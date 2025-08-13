import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import { FaEye, FaEdit, FaEnvelope, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import NavbarTopbar from '../Navbar/NavbarTopbar';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './PayslipTable.css';

const PayslipTable = () => {
  const [payslips, setPayslips] = useState([]);
  const [data, setData] = useState([]);

  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    from: 'bharathsiripuram98@gmail.com',
    to: '',
    date: '',
    time: ''
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const rowsPerPage = 15;

  const fetchPayslips = async () => {
    const snapshot = await getDocs(collection(db, 'payslips'));
    let allPayslips = [];

    snapshot.forEach(docSnap => {
      const p = docSnap.data();

      // If slips array exists, flatten it into separate rows
      if (Array.isArray(p.slips) && p.slips.length > 0) {
        p.slips.forEach(slip => {
          allPayslips.push({
            id: docSnap.id + '_' + slip.date, 
            badgeId: slip.badgeId || p.badgeId || '',
            uid: slip.uid || p.uid || '',
            firstName: slip.firstName || p.firstName || '',
            email: slip.email || p.email || '',
            phone: slip.phone || p.phone || '',
            departments: slip.departments || p.departments || '',
            jobRole: slip.jobRole || p.jobRole || '',
            reportingManager: slip.reportingManager || p.reportingManager || '',
            bankName: slip.bankName || p.bankName || '',
            ifsc: slip.ifsc || p.ifsc || '',
            branchName: slip.branchName || p.branchName || '',
            basicSalary: slip.basicSalary || p.basicSalary || 0,
            allowances: slip.allowances || p.allowances || 0,
            deductions: slip.deductions || p.deductions || 0,
            netSalary: slip.netSalary || p.netSalary || 0,
            status: slip.status || p.status || '',
            date: slip.date || p.date || '',
            slips: [slip]
          });
        });
      } else {
        allPayslips.push({
          id: docSnap.id,
          ...p,
          slips: []
        });
      }
    });

    setPayslips(allPayslips);
  };



  useEffect(() => {

    fetchPayslips();
    const interval = setInterval(fetchPayslips, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredPayslips = payslips.filter(p => {
    if (!p.date) return false;
    const d = moment(p.date, ["DD/MM/YYYY", "YYYY-MM-DD"]); // parse both formats
    return d.month() + 1 === Number(selectedMonth) && d.year() === Number(selectedYear);
  });


  const handleView = p => {
    setSelectedPayslip(p);
    setShowModal(true);
  };

  const handleEmail = p => {
    const now = new Date();
    setSelectedPayslip(p);
    setEmailData({
      from: 'bharathsiripuram98@gmail.com',
      to: p.email || '',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(':').slice(0, 2).join(':')
    });
    setShowEmailModal(true);
  };

  const sendScheduledEmail = async () => {
    if (!selectedPayslip) return;
    try {
      await axios.post('http://localhost:5000/api/email_send', {
        uid: selectedPayslip.uid,
        recipient: emailData.to,
        firstName: selectedPayslip.firstName,
        basicSalary: selectedPayslip.basicSalary,
        allowances: selectedPayslip.allowances,
        deductions: selectedPayslip.deductions,
        netSalary: selectedPayslip.netSalary,
        date: selectedPayslip.date,
        badgeId: selectedPayslip.badgeId,
        phone: selectedPayslip.phone,
        bankName: selectedPayslip.bankName,
        branchName: selectedPayslip.branchName,
        ifsc: selectedPayslip.ifsc,
        jobRole: selectedPayslip.jobRole,
         reportingManager: selectedPayslip.reportingManager ,  
        departments: selectedPayslip.departments,
paymentMethod: selectedPayslip.paymentMethod || 'Bank Transfer'
      });
      alert('Email sent successfully');

      setShowEmailModal(false);
      fetchPayslips();
    } catch (e) {
      console.error(e);
      alert('Error sending email');
    }
  };


  const toggleRowSelection = id =>
    setSelectedRows(prev => (prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]));

  const toggleSelectAll = () =>
    selectedRows.length === filteredPayslips.length
      ? setSelectedRows([])
      : setSelectedRows(filteredPayslips.map(p => p.id));

const exportSelectedRows = () => {
  if (selectedRows.length === 0) return alert('Please select at least one row');

  const selectedData = filteredPayslips
    .filter(p => selectedRows.includes(p.id))
    .map(({ slips, ...rest }) => rest);  // exclude 'slips' property

  const worksheet = XLSX.utils.json_to_sheet(selectedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payslips');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'payslips.xlsx');
};


  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredPayslips.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredPayslips.length / rowsPerPage);

  const handleDelete = async (employeeId, date) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this payslip?");
    if (!confirmDelete) return;

    try {
      const encodedEmployeeId = encodeURIComponent(employeeId);
      const encodedDate = encodeURIComponent(date);  // e.g. "08/08/2025"

      const res = await fetch(`http://localhost:5000/api/salary/${encodedEmployeeId}/${encodedDate}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setData(prevData => prevData.filter(p => !(p.uid === employeeId && p.date === date)));
        alert('Deleted successfully');
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert('Error deleting record');
    }
  };




  return (
    <>
      <NavbarTopbar />
      <div className="payslip-table-wrapper mt-5">
        <h2 className="me-3 mb-2">Payslip Records</h2>

        <div className="d-flex justify-content-between mb-3">
          <div className="d-flex">
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="form-select me-2" style={{ width: '150px' }}>
              {moment.months().map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="form-select" style={{ width: '120px' }}>
              {[...Array(5)].map((_, i) => {
                const year = moment().year() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="secondary" onClick={toggleSelectAll} className="me-2">
            {selectedRows.length === filteredPayslips.length ? 'Unselect All' : 'Select All'}
          </Button>
          <Button variant="info" onClick={exportSelectedRows} className="me-2">
            Export Selected ({selectedRows.length})
          </Button>
        </div>

        <div className="table-container">
          <table className="payslip-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selectedRows.length === filteredPayslips.length && filteredPayslips.length > 0} onChange={toggleSelectAll} /></th>
                <th>S.No</th>
                <th>BadgeId</th>
                <th>Name</th>
                <th>Department</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Basic</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Bank</th>
                <th>IFSC</th>
                <th>Status</th>
                <th >Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? currentRows.map((p, i) => (
                <tr key={p.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(p.id)}
                      onChange={() => toggleRowSelection(p.id)}
                    />
                  </td>
                  <td>{indexOfFirstRow + i + 1}</td>
                  <td>{p.badgeId}</td>
                  <td>{p.firstName}</td>
                  <td>{p.departments}</td>
                  <td>{p.email}</td>
                  <td>{p.phone}</td>
                  <td>₹{p.basicSalary}</td>
                  <td>₹{p.allowances}</td>
                  <td>₹{p.deductions}</td>
                  <td>₹{p.netSalary}</td>
                  <td>{p.bankName}</td>
                  <td>{p.ifsc}</td>
                  <td>
                    <span className={`status-badge ${p.status === 'Sent' ? 'paid' : 'unpaid'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>{p.date}</td>
                  <td>
                    <div className="action-icons-container">
                      <div className="action-icon-pair">
                        <span className="icon-btn text-primary" onClick={() => handleView(p)} title="View">
                          <FaEye />
                        </span>
                        <Link to={`/payslipedit/${p.uid}/${p.date}`}>
                          <span className="icon-btn text-warning" title="Edit">
                            <FaEdit />
                          </span>
                        </Link>
                      </div>
                      <div className="action-icon-pair">
                        <span className="icon-btn text-success" onClick={() => handleEmail(p)} title="Email">
                          <FaEnvelope />
                        </span>
                        <span className="icon-btn text-danger" onClick={() => handleDelete(p.uid, p.date)} title="Delete">
                          <FaTrash />
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="16" className="text-center text-muted">No payslips found</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="pagination-controls">
          <span onClick={() => currentPage > 1 && setCurrentPage(prev => prev - 1)}>&lt;</span>
          <span>Page {currentPage} of {totalPages}</span>
          <span onClick={() => currentPage < totalPages && setCurrentPage(prev => prev + 1)}>&gt;</span>
        </div>


        {/* View Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Payslip Details - {selectedPayslip?.firstName} ({selectedPayslip?.badgeId})</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPayslip && (
              <div className="container-fluid">
                <div className="row mb-3">
                  <div className="col-md-4"><strong>Date:</strong> {selectedPayslip.date}</div>
                  <div className="col-md-4"><strong>Status:</strong>
                    <span className={`status-badge ${selectedPayslip.status === 'Sent' ? 'paid' : 'unpaid'}`}>
                      {selectedPayslip.status}
                    </span>
                  </div>
                  <div className="col-md-4"><strong>Department:</strong> {selectedPayslip.departments}</div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4"><strong>Basic Salary:</strong> ₹{selectedPayslip.basicSalary}</div>
                  <div className="col-md-4"><strong>Allowances:</strong> ₹{selectedPayslip.allowances}</div>
                  <div className="col-md-4"><strong>Deductions:</strong> ₹{selectedPayslip.deductions}</div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4"><strong>Net Salary:</strong> ₹{selectedPayslip.netSalary}</div>
                  <div className="col-md-4"><strong>Bank:</strong> {selectedPayslip.bankName}</div>
                  <div className="col-md-4"><strong>IFSC:</strong> {selectedPayslip.ifsc}</div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4"><strong>Branch:</strong> {selectedPayslip.branchName}</div>
                  <div className="col-md-4"><strong>Email:</strong> {selectedPayslip.email}</div>
                  <div className="col-md-4"><strong>Phone:</strong> {selectedPayslip.phone}</div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4"><strong>Job Role:</strong> {selectedPayslip.jobRole}</div>
                  <div className="col-md-4"><strong>Reporting Manager:</strong> {selectedPayslip.reportingManager}</div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
        {/* Email Modal */}
        <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Schedule Email</Modal.Title></Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <label className="form-label">From:</label>
              <input type="email" className="form-control" value={emailData.from} disabled />
            </div>
            <div className="mb-3">
              <label className="form-label">To:</label>
              <input type="email" className="form-control" value={emailData.to} onChange={e => setEmailData({ ...emailData, to: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label">Date:</label>
              <input type="date" className="form-control" value={emailData.date} onChange={e => setEmailData({ ...emailData, date: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label">Time:</label>
              <input type="time" className="form-control" value={emailData.time} onChange={e => setEmailData({ ...emailData, time: e.target.value })} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" className='single-email-button' onClick={sendScheduledEmail}>Send Email</Button>
            <Button variant="secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default PayslipTable;
