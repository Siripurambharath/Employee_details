import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import './Payslipedit.css';
import { FaArrowLeft } from 'react-icons/fa';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const Payslipedit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    badgeId: '',
    name: '',
    departments: '',
    email: '',
    phone: '',
    basicSalary: '',
    allowances: '',
    deductions: '',
    netSalary: '',
    bank: '',
    ifsc: '',
    status: '',
    date: '',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        const docRef = doc(db, 'payslips', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
      setFormData({
  badgeId: data.badgeId || '',
  name: data.name || '',
  departments: data.departments || '',
  email: data.email || '',
  phone: data.phone || '',
  basicSalary: data.basicSalary || '',
  allowances: data.allowances || '',
  deductions: data.deductions || '',
  netSalary: data.netSalary || '',
  bankName: data.bankName || '',   // fixed
  ifsc: data.ifsc || '',
  status: data.status || '',
  date: data.date || '',
});

        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching payslip:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslip();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'payslips', id);
     await setDoc(docRef, {
  badgeId: formData.badgeId,
  name: formData.name,
  departments: formData.departments,
  email: formData.email,
  phone: formData.phone,
  basicSalary: formData.basicSalary,
  allowances: formData.allowances,
  deductions: formData.deductions,
  netSalary: formData.netSalary,
  bankName: formData.bankName,  // fixed
  ifsc: formData.ifsc,
  status: formData.status,
  date: formData.date,
});

      alert('Payslip updated successfully!');
      navigate('/payslip');
    } catch (error) {
      console.error('Error updating payslip:', error);
    }
  };

  if (loading) return <p>Loading payslip data...</p>;

 const fields = [
  ['badgeId', 'Badge ID'],
  ['name', 'Name'],
  ['departments', 'Department'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['basicSalary', 'Basic Salary'],
  ['allowances', 'Allowances'],
  ['deductions', 'Deductions'],
  ['netSalary', 'Net Salary'],
  ['bankName', 'Bank Name'],   // fixed
  ['ifsc', 'IFSC'],
  ['status', 'Status'],
  ['date', 'Pay Date'],
];


  return (
    <>
      <NavbarTopbar />
      <div className="payslip-edit-container">
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
                value={formData[key]}
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
