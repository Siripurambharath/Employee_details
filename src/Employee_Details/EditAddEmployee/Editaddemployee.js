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
    <div className="edit-employee-container mt-4">
    
      
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
        <h3 className="edit-employee-title">Personal Info </h3>
   <form onSubmit={handleSubmit} className="edit-employee-form">
  <div className="row">
    {/* Hidden Badge ID */}
    <input type="hidden" name="badgeId" value={formData.badgeId} readOnly />

    <div className='row'>
    <div className="col-md-4 mb-3">
      <label className="form-label">First Name</label>
      <input
        type="text"
        name="firstName"
        className="form-control"
        placeholder="Enter first name"
        value={formData.firstName}
        onChange={handleChange}
        required
      />
    </div>
    <div className="col-md-4 mb-3">
      <label className="form-label">Last Name</label>
      <input
        type="text"
        name="lastName"
        className="form-control"
        placeholder="Enter last name"
        value={formData.lastName}
        onChange={handleChange}
        required
      />
    </div>
    <div className="col-md-4 mb-3">
      <label className="form-label">Email</label>
      <input
        type="email"
        name="email"
        className="form-control"
        placeholder="Enter email"
        value={formData.email}
        onChange={handleChange}
        required
      />
    </div>
    </div>

  <div className='row'>

  
    <div className="col-md-4 mb-3">
      <label className="form-label">Phone Number</label>
      <input
        type="text"
        name="phone"
        className="form-control"
        placeholder="Enter phone number"
        value={formData.phone}
        onChange={handleChange}
      />
    </div>
   
    <div className="col-md-4 mb-3">
      <label className="form-label">City</label>
      <input
        type="text"
        name="city"
        className="form-control"
        placeholder="Enter city"
        value={formData.city}
        onChange={handleChange}
      />
    </div>

    {/* 3rd Row: State, DOB, Gender */}
    <div className="col-md-4 mb-3">
      <label className="form-label">State</label>
      <select
        className="form-select"
        name="state"
        value={formData.state}
        onChange={handleChange}
        required
      >
        <option value="">Select State</option>
        <option>Andhra Pradesh</option>
        <option>Arunachal Pradesh</option>
        <option>Assam</option>
        <option>Bihar</option>
        <option>Chhattisgarh</option>
        <option>Goa</option>
        <option>Gujarat</option>
        <option>Haryana</option>
        <option>Himachal Pradesh</option>
        <option>Jharkhand</option>
        <option>Karnataka</option>
        <option>Kerala</option>
        <option>Madhya Pradesh</option>
        <option>Maharashtra</option>
        <option>Manipur</option>
        <option>Meghalaya</option>
        <option>Mizoram</option>
        <option>Nagaland</option>
        <option>Odisha</option>
        <option>Punjab</option>
        <option>Rajasthan</option>
        <option>Sikkim</option>
        <option>Tamil Nadu</option>
        <option>Telangana</option>
        <option>Tripura</option>
        <option>Uttar Pradesh</option>
        <option>Uttarakhand</option>
        <option>West Bengal</option>
        <option>Andaman and Nicobar Islands</option>
        <option>Chandigarh</option>
        <option>Dadra and Nagar Haveli and Daman & Diu</option>
        <option>Delhi</option>
        <option>Jammu and Kashmir</option>
        <option>Ladakh</option>
        <option>Lakshadweep</option>
        <option>Puducherry</option>
      </select>
    </div>
    </div>
    <div className='row'>
     <div className="col-md-12 mb-3">
      <label className="form-label">Address</label>
      <textarea
        name="address"
        className="form-control"
        placeholder="Enter address"
        value={formData.address}
        onChange={handleChange}
        rows="2"
      />
    </div>

    </div>
    <div className="col-md-4 mb-3">
      <label className="form-label">Date of Birth</label>
      <input
        type="date"
        name="dob"
        className="form-control"
        value={formData.dob}
        onChange={handleChange}
      />
    </div>
    <div className="col-md-4 mb-3">
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

    {/* 4th Row: Qualifications, Experience, Marital Status */}
    <div className="col-md-4 mb-3">
      <label className="form-label">Qualifications</label>
      <input
        type="text"
        name="qualifications"
        className="form-control"
        placeholder="Enter qualifications"
        value={formData.qualifications}
        onChange={handleChange}
      />
    </div>
    <div className="col-md-4 mb-3">
      <label className="form-label">Experience</label>
      <select
        className="form-select"
        name="experience"
        value={formData.experience}
        onChange={handleChange}
        required
      >
        <option value="">Select Experience</option>
        <option value="Fresher">Fresher</option>
        <option value="0-6 Months">0-6 Months</option>
        <option value="0-1 Years">0-1 Years</option>
        <option value="1-2 Years">1-2 Years</option>
        <option value="2-3 Years">2-3 Years</option>
        <option value="3-5 Years">3-5 Years</option>
        <option value="5-10 Years">5-10 Years</option>
        <option value="10+ Years">10+ Years</option>
      </select>
    </div>
    <div className="col-md-4 mb-3">
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
        <option value="Widowed">Widowed</option>
      </select>
    </div>

    {/* 5th Row: Emergency Contact */}
    <div className="col-md-4 mb-3">
      <label className="form-label">Emergency Contact Name</label>
      <input
        type="text"
        name="emergencyContactName"
        className="form-control"
        placeholder="Enter name"
        value={formData.emergencyContactName}
        onChange={handleChange}
      />
    </div>
    <div className="col-md-4 mb-3">
      <label className="form-label">Emergency Contact Number</label>
      <input
        type="text"
        name="emergencyContactNumber"
        className="form-control"
        placeholder="Enter number"
        value={formData.emergencyContactNumber}
        onChange={handleChange}
      />
    </div>
    <div className="col-md-4 mb-3">
      <label className="form-label">Emergency Contact Relation</label>
      <input
        type="text"
        name="emergencyContactRelation"
        className="form-control"
        placeholder="Enter relation"
        value={formData.emergencyContactRelation}
        onChange={handleChange}
      />
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