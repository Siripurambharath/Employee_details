import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { db } from '../Firebase/Firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import './BankDetail.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const BankDetail = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    branch: '',
    ifsc: '',
    address: '',
    state: '',
    city: '',
  });

  const [badgeId, setBadgeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const personalInfo = JSON.parse(localStorage.getItem('personalInfo'));
    const bankInfo = JSON.parse(localStorage.getItem('bankInfo'));

    if (personalInfo) {
      setBadgeId(personalInfo.badgeId);
    }

    if (bankInfo) {
      setFormData(bankInfo);
    }
  }, []);

  const handleChange = (e) => {
    const updatedForm = { ...formData, [e.target.name]: e.target.value };
    setFormData(updatedForm);
    localStorage.setItem('bankInfo', JSON.stringify(updatedForm));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bankName || !formData.accountNumber || !formData.ifsc) {
      return alert('Bank name, account number, and IFSC are required');
    }

    setIsSubmitting(true);
    try {
      const personalInfo = JSON.parse(localStorage.getItem('personalInfo'));
      const workInfo = JSON.parse(localStorage.getItem('workInfo'));

      if (!personalInfo || !workInfo) {
        throw new Error('Missing personal or work information');
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        personalInfo.email,
        personalInfo.password
      );

      const uid = userCredential.user.uid;

      // Prepare complete employee data
      const employeeData = {
        ...personalInfo,
        ...workInfo,
        ...formData,
        uid: uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
      };

      // Save to Firestore
      await setDoc(doc(db, 'users', uid), employeeData);

      // Save badge ID reference
      const badgeNumber = parseInt(personalInfo.badgeId.replace('BADGE', ''));
      await addDoc(collection(db, 'badgeIds'), {
        badgeId: personalInfo.badgeId,
        badgeNumber: badgeNumber,
        userId: uid,
        assignedAt: new Date().toISOString(),
        status: 'assigned'
      });

      // Clear local storage
      localStorage.removeItem('personalInfo');
      localStorage.removeItem('workInfo');
      localStorage.removeItem('bankInfo');
  
      alert('Employee registered successfully!');
      navigate('/employee');

    } catch (error) {
      console.error('Error saving employee:', error);
      alert(`Failed to save employee data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <NavbarTopbar />
      <div className="bank-detail-container container mt-4">
        <div className="edit-tabs d-flex gap-3 mb-3">
          <NavLink to="/addemployee" className={({ isActive }) => isActive ? 'edit-tabs-link active' : 'edit-tabs-link'}>
            Personal Info
          </NavLink>
          <NavLink to="/workdetail" className={({ isActive }) => isActive ? 'edit-tabs-link active' : 'edit-tabs-link'}>
            Work Info
          </NavLink>
          <NavLink to="/bankdetail" className={({ isActive }) => isActive ? 'edit-tabs-link active' : 'edit-tabs-link'}>
            Bank Info
          </NavLink>
        </div>

        <div className="card shadow-sm p-4">
          <h4 className="fw-bold mb-4">Bank Information</h4>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {[
                { label: 'Bank Name', name: 'bankName', required: true },
                { label: 'Account Number', name: 'accountNumber', required: true },
                { label: 'Branch', name: 'branch' },
                { label: 'IFSC Code', name: 'ifsc', required: true },
                { label: 'Bank Address', name: 'address' },
                { label: 'State', name: 'state' },
                { label: 'City', name: 'city' }
              ].map((field, index) => (
                <div key={index} className={`col-md-${field.name === 'address' ? '12' : '6'}`}>
                  <label className="form-label">{field.label}</label>
                  <input
                    type="text"
                    name={field.name}
                    className="form-control"
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required || false}
                  />
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => navigate('/workdetail')}
              >
                Back
              </button>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default BankDetail;