import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AddEmployee.css';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const AddEmployee = () => {
  const [badgeId, setBadgeId] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    state: '', city: '', dob: '', gender: '', qualifications: '',
    experience: '', maritalStatus: '', emergencyContactName: '',
    emergencyContactNumber: '', emergencyContactRelation: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const generateBadgeId = async () => {
      try {
        const savedPersonalInfo = localStorage.getItem('personalInfo');
        if (savedPersonalInfo) {
          const savedData = JSON.parse(savedPersonalInfo);
          if (savedData.badgeId) {
            setBadgeId(savedData.badgeId);
            setFormData(savedData);
            return;
          }
        }

        const badgeIdsRef = collection(db, 'badgeIds');
        const q = query(badgeIdsRef, orderBy("badgeNumber", "desc"), limit(1));
        const snapshot = await getDocs(q);

        const lastNumber = snapshot.empty ? 0 : snapshot.docs[0].data().badgeNumber;
        const newBadgeId = `BADGE${lastNumber + 1}`;
        setBadgeId(newBadgeId);

      } catch (error) {
        console.error("Error generating badge ID:", error);
      }
    };

    generateBadgeId();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.firstName) {
      return alert('First name required');
    }

    const personalInfo = { 
      ...formData, 
      badgeId,
      password: `${formData.firstName.toLowerCase()}@123` 
    };
    
    localStorage.setItem('personalInfo', JSON.stringify(personalInfo));
    navigate('/workdetail');
  };

  return (
    <>
      <NavbarTopbar />
      <div className="add-employee-container container mt-4">
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
       
        <div className="card shadow p-4">
          <h3 className="mb-4">Add Employee</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Badge ID</label>
              <input 
                type="text" 
                className="form-control" 
                value={badgeId || 'Generating...'} 
                readOnly 
              />
            </div>

            <div className="row">
              {[
                { label: 'First Name', name: 'firstName' },
                { label: 'Last Name', name: 'lastName' },
                { label: 'Email', name: 'email', type: 'email' },
                { label: 'Phone Number', name: 'phone' },
                { label: 'Address', name: 'address' },
                { label: 'State', name: 'state', col: 3 },
                { label: 'City', name: 'city', col: 3 },
                { label: 'Date of Birth', name: 'dob', type: 'date' },
                { label: 'Qualifications', name: 'qualifications' },
                { label: 'Experience', name: 'experience' },
                { label: 'Emergency Contact Name', name: 'emergencyContactName' },
                { label: 'Emergency Contact Number', name: 'emergencyContactNumber' },
                { label: 'Emergency Contact Relation', name: 'emergencyContactRelation' },
              ].map(({ label, name, type = 'text', col = 6 }) => (
                <div className={`col-md-${col} mb-3`} key={name}>
                  <label className="form-label">{label}</label>
                  <input
                    type={type}
                    name={name}
                    className="form-control"
                    placeholder={`Enter ${label.toLowerCase()}`}
                    value={formData[name]}
                    onChange={handleChange}
                    required
                  />
                </div>
              ))}

              <div className="col-md-6 mb-3">
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Marital Status</label>
                <select
                  className="form-select"
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select status</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Divorced</option>
                </select>
              </div>
            </div>

            <div className="text-end">
              <button type="submit" className="btn btn-primary mt-3">
                Save and Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddEmployee;