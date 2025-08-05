import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import { FaEye, FaEdit, FaEnvelope } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import NavbarTopbar from '../Navbar/NavbarTopbar';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './PayslipTable.css';

const PayslipTable = () => {
  const [payslips, setPayslips] = useState([]);
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

  // ============ Fetch Payslips ============
  const fetchPayslips = async () => {
    const snapshot = await getDocs(collection(db, 'payslips'));
    let allPayslips = [];
    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      allPayslips.push({
        id: p.id,
        uid: p.uid,
        name: p.name,
        email: p.email,
        phone: p.phone,
        bankName: p.bankName,
        ifsc: p.ifsc,
        departments: p.departments,
        badgeId: p.badgeId,
        jobRole: p.jobRole,
        basicSalary: p.basicSalary,
        allowances: p.allowances,
        deductions: p.deductions,
        netSalary: p.netSalary,
        status: p.status,
        date: p.date,
        comment: p.comment || ''
      });
    });
    setPayslips(allPayslips);
  };

  useEffect(() => {
    fetchPayslips();
    const interval = setInterval(fetchPayslips, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter by month and year
  const filteredPayslips = payslips.filter(p => {
    if (!p.date) return false;
    const d = moment(p.date);
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
        name: selectedPayslip.name,
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
        departments: selectedPayslip.departments,
        paymentMethod: 'Bank Transfer'
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
    const selectedData = filteredPayslips.filter(p => selectedRows.includes(p.id));
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

  return (
    <>
      <NavbarTopbar />
      <div className="payslip-table-wrapper">
        {/* Filter */}
        <div className="d-flex justify-content-between mb-3">
          <h2 className="me-3 mb-0">Payslip Records</h2>
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

        {/* Actions */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="secondary" onClick={toggleSelectAll} className="me-2">
            {selectedRows.length === filteredPayslips.length ? 'Unselect All' : 'Select All'}
          </Button>
          <Button variant="info" onClick={exportSelectedRows} className="me-2">
            Export Selected ({selectedRows.length})
          </Button>
        </div>

        {/* Table */}
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
                <th>Net</th>
                <th>Bank</th>
                <th>IFSC</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? currentRows.map((p, i) => (
                <tr key={p.id}>
                  <td><input type="checkbox" checked={selectedRows.includes(p.id)} onChange={() => toggleRowSelection(p.id)} /></td>
                  <td>{indexOfFirstRow + i + 1}</td>
                  <td>{p.badgeId}</td>
                  <td>{p.name}</td>
                  <td>{p.departments}</td>
                  <td>{p.email}</td>
                  <td>{p.phone}</td>
                  <td>₹{p.basicSalary}</td>
                  <td>₹{p.allowances}</td>
                  <td>₹{p.deductions}</td>
                  <td>₹{p.netSalary}</td>
                  <td>{p.bankName}</td>
                  <td>{p.ifsc}</td>
                  <td><span className={`status-badge ${p.status === 'Sent' ? 'paid' : 'unpaid'}`}>{p.status}</span></td>
                  <td>{p.date}</td>
                  <td>
                    <span className="icon-btn text-primary" onClick={() => handleView(p)}><FaEye /></span>
                    <Link to={`/payslipedit/${p.id}`}><span className="icon-btn text-warning"><FaEdit /></span></Link>
                    <span className="icon-btn text-success" onClick={() => handleEmail(p)}><FaEnvelope /></span>
                  </td>
                </tr>
              )) : <tr><td colSpan="16" className="text-center text-muted">No payslips found</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination-controls">
          <span onClick={() => currentPage > 1 && setCurrentPage(prev => prev - 1)}>&lt;</span>
          <span>Page {currentPage} of {totalPages}</span>
          <span onClick={() => currentPage < totalPages && setCurrentPage(prev => prev + 1)}>&gt;</span>
        </div>

        {/* View Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton><Modal.Title>Payslip Details</Modal.Title></Modal.Header>
          <Modal.Body>
            {selectedPayslip && (
              <div className="row g-3">
                <div className="col-md-6"><strong>Name:</strong> {selectedPayslip.name}</div>
                <div className="col-md-6"><strong>Email:</strong> {selectedPayslip.email}</div>
                <div className="col-md-6"><strong>Phone:</strong> {selectedPayslip.phone}</div>
                <div className="col-md-6"><strong>Job Role:</strong> {selectedPayslip.jobRole}</div>
                <div className="col-md-6"><strong>Basic:</strong> ₹{selectedPayslip.basicSalary}</div>
                <div className="col-md-6"><strong>Allowances:</strong> ₹{selectedPayslip.allowances}</div>
                <div className="col-md-6"><strong>Deductions:</strong> ₹{selectedPayslip.deductions}</div>
                <div className="col-md-6"><strong>Net:</strong> ₹{selectedPayslip.netSalary}</div>
                <div className="col-md-6"><strong>Status:</strong> {selectedPayslip.status}</div>
                <div className="col-md-6"><strong>Date:</strong> {selectedPayslip.date}</div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button></Modal.Footer>
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
            <Button variant="primary" onClick={sendScheduledEmail}>Send Email</Button>
            <Button variant="secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default PayslipTable;
