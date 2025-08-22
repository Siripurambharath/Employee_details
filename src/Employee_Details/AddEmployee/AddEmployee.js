import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AddEmployee.css';
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
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
  const [newBadgeNumber, setNewBadgeNumber] = useState(0);

  // Generate Badge ID
  useEffect(() => {
    const generateBadgeId = async () => {
      try {
        const badgeDocRef = doc(db, 'badgeIds', 'lastBadge');
        const badgeDocSnap = await getDoc(badgeDocRef);

        let number = 1;
        if (badgeDocSnap.exists()) {
          number = badgeDocSnap.data().badgeNumber || 0;
          number += 1;
        }

        setNewBadgeNumber(number);
        setBadgeId(`BADGE${number}`);
      } catch (error) {
        console.error('Error generating badge ID:', error);
      }
    };

    generateBadgeId();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName) {
      return alert('First name required');
    }

    const personalInfo = { 
      ...formData, 
      badgeId,
      password: `${formData.firstName.toLowerCase()}@123` 
    };

    try {
      // Save employee data in Firestore
      await setDoc(doc(db, 'employees', badgeId), personalInfo);

      // Update last badge number
      const badgeDocRef = doc(db, 'badgeIds', 'lastBadge');
      await setDoc(badgeDocRef, { badgeNumber: newBadgeNumber });

      localStorage.setItem('personalInfo', JSON.stringify(personalInfo));
      navigate('/workdetail');
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  // Function to delete employee (use this in list view)
  const deleteEmployee = async (badgeIdToDelete) => {
    try {
      await deleteDoc(doc(db, 'employees', badgeIdToDelete));

      // Decrement badge number
      const badgeDocRef = doc(db, 'badgeIds', 'lastBadge');
      const badgeDocSnap = await getDoc(badgeDocRef);
      if (badgeDocSnap.exists()) {
        let lastNumber = badgeDocSnap.data().badgeNumber || 1;
        if (lastNumber > 1) {
          lastNumber -= 1;
          await updateDoc(badgeDocRef, { badgeNumber: lastNumber });
        }
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
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
          <h3 className="mb-4">Personal Info</h3>
     <form onSubmit={handleSubmit}>
  {/* Hidden Badge ID (not shown, but stored in DB) */}
  <input type="hidden" name="badgeId" value={badgeId} />

  <div className="row">
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

  <div className="row">
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
        <option>Chandigarh</option>
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

  <div className="row">
    
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
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
    </div>

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
  </div>

  <div className="row">


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
        <option>Single</option>
        <option>Married</option>
        <option>Divorced</option>
        <option>Widowed</option> 
      </select>
    </div>
     <div className="col-md-4 mb-3">
      <label className="form-label">Emergency Contact Name</label>
      <input
        type="text"
        name="emergencyContactName"
        className="form-control"
        placeholder="Enter contact name"
        value={formData.emergencyContactName}
        onChange={handleChange}
      />
    </div>
  </div>

  <div className="row">
   

    <div className="col-md-4 mb-3">
      <label className="form-label">Emergency Contact Number</label>
      <input
        type="text"
        name="emergencyContactNumber"
        className="form-control"
        placeholder="Enter contact number"
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
