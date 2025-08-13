import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import './Payslipedit.css';
import { FaArrowLeft } from 'react-icons/fa';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const Payslipedit = () => {
  const { employeeId, date } = useParams(); // URL like /payslipedit/:employeeId/:date
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Convert "dd-MM-yyyy" (Firestore format) to "yyyy-MM-dd" for date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-'); // expected dd-MM-yyyy
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Convert "yyyy-MM-dd" (input) to "dd-MM-yyyy" (Firestore)
  const formatDateForStorage = (inputDate) => {
    if (!inputDate) return '';
    const parts = inputDate.split('-'); // yyyy-MM-dd
    if (parts.length !== 3) return inputDate;
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  };

  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        const docRef = doc(db, 'payslips', employeeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Find payslip by date in "dd-MM-yyyy" format
          const payslip = data.slips?.find(slip => slip.date === date);

          if (payslip) {
            setFormData(payslip);
          } else {
            console.log('No payslip found for date:', date);
            setFormData(null);
          }
        } else {
          console.log('No payslip document for employee:', employeeId);
          setFormData(null);
        }
      } catch (error) {
        console.error('Error fetching payslip:', error);
        setFormData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslip();
  }, [employeeId, date]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'date') {
      setFormData(prev => ({
        ...prev,
        [name]: formatDateForStorage(value), // store with dashes dd-MM-yyyy
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData) return;

    try {
      const docRef = doc(db, 'payslips', employeeId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert('Employee payslip document not found');
        return;
      }

      const data = docSnap.data();
      const slips = data.slips || [];

      // Replace the payslip in slips array by matching original date param
      const updatedSlips = slips.map(slip =>
        slip.date === date ? formData : slip
      );

      await setDoc(docRef, { slips: updatedSlips }, { merge: true });

      alert('Payslip updated successfully!');
      navigate('/payslip');
    } catch (error) {
      console.error('Error updating payslip:', error);
      alert('Failed to update payslip');
    }
  };

  if (loading) return <p>Loading payslip data...</p>;
  if (!formData) return <p>No payslip found for this date.</p>;

  const fields = [
    ['badgeId', 'Badge ID'],
    ['firstName', 'Name'],
    ['departments', 'Department'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['basicSalary', 'Basic Salary'],
    ['allowances', 'Allowances'],
    ['deductions', 'Deductions'],
    ['netSalary', 'Net Salary'],
    ['bankName', 'Bank Name'],
    ['ifsc', 'IFSC'],
    ['status', 'Status'],
    ['date', 'Pay Date'],
  ];

  return (
    <>
      <NavbarTopbar />
      <div className="payslip-edit-container mt-5">
        <button
          className="payslip-edit-back-button"
          onClick={() => navigate('/payslip')}
        >
          <FaArrowLeft className="payslip-edit-back-icon" /> Back
        </button>

        <h2 className="payslip-edit-heading">Edit Payslip</h2>

        <form onSubmit={handleSubmit} className="payslip-edit-form">
          {fields.map(([key, label]) => (
            <div key={key} className="payslip-edit-form-group">
              <label>{label}</label>
              <input
                type={key === 'date' ? 'date' : 'text'}
                name={key}
                value={
                  key === 'date'
                    ? formatDateForInput(formData[key])
                    : formData[key] || ''
                }
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <button type="submit" className="payslip-edit-save-button">
            Save
          </button>
        </form>
      </div>
    </>
  );
};

export default Payslipedit;
