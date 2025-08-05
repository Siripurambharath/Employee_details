import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from '../Firebase/Firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './Editaddemployee.css';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const Editaddemployee = () => {
  const { badgeId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    badgeId: '', firstName: '', lastName: '', email: '', phone: '',
    address: '', state: '', city: '', dob: '', gender: '', qualifications: '',
    experience: '', maritalStatus: '', emergencyContactName: '',
    emergencyContactNumber: '', emergencyContactRelation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'users'), where('badgeId', '==', badgeId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setFormData(docData);
        } else {
          const docRef = doc(db, 'users', badgeId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData(docSnap.data());
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchData();
  }, [badgeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const q = query(collection(db, 'users'), where('badgeId', '==', badgeId));
      const querySnapshot = await getDocs(q);
      
      let docRef;
      if (!querySnapshot.empty) {
        docRef = doc(db, 'users', querySnapshot.docs[0].id);
      } else {
        docRef = doc(db, 'users', badgeId);
      }
      
      await updateDoc(docRef, formData);
      navigate(`/Editworkdetail/${badgeId}`);
    } catch (error) {
      console.error("Error updating personal info:", error);
      alert("Failed to update personal info");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <NavbarTopbar />
    <div className="edit-employee-container">
    
      
      <div className="edit-employee-tabs">
        <NavLink to={`/Editaddemployee/${badgeId}`} className={({ isActive }) => isActive ? 'edit-employee-tab-link active' : 'edit-employee-tab-link'}>
          Personal Info
        </NavLink>
        <NavLink to={`/Editworkdetail/${badgeId}`} className={({ isActive }) => isActive ? 'edit-employee-tab-link' : 'edit-employee-tab-link'}>
          Work Info
        </NavLink>
        <NavLink to={`/Editbankdetail/${badgeId}`} className={({ isActive }) => isActive ? 'edit-employee-tab-link' : 'edit-employee-tab-link'}>
          Bank Info
        </NavLink>
      </div>
        <Link to="/employee" className="edit-employee-back-link">
        <FaArrowLeft /> Back
      </Link>

      <div className="edit-employee-card">
        <h3 className="edit-employee-title">Edit Employee</h3>
        <form onSubmit={handleSubmit} className="edit-employee-form">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Badge ID</label>
              <input
                type="text"
                name="badgeId"
                className="form-control"
                placeholder='Badge Id'
                value={formData.badgeId}
                onChange={handleChange}
                required
                readOnly
              />
            </div>

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
                  required={name === 'email' || name === 'firstName' || name === 'lastName'}
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
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
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
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
          </div>

          <div className="text-end">
            <button type="submit" className="btn btn-primary edit-employee-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save & Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default Editaddemployee;