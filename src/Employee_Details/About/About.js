import React, { useState, useEffect } from 'react';
import {
  FaUserCircle, FaEnvelope, FaPhone, FaBuilding, FaMapMarkerAlt, FaCalendarAlt,
  FaVenusMars, FaSuitcase, FaBriefcase, FaUniversity, FaMoneyBillWave, FaTags,
  FaLocationArrow, FaCity, FaAddressCard, FaLandmark, FaIdCard, FaUserTie
} from 'react-icons/fa';
import { NavLink, useParams } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import './About.css';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const About = () => {
  const [u, setU] = useState(null);
  const { id: clickedBadgeIdFromURL } = useParams();
  const loginEmail = localStorage.getItem('email')?.trim().toLowerCase();
  const isAdmin = loginEmail === 'admin@gmail.com';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let matchedUser = null;

        if (clickedBadgeIdFromURL) {
          const q = query(collection(db, 'users'), where('badgeId', '==', clickedBadgeIdFromURL));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            matchedUser = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          } else {
            const docRef = doc(db, 'users', clickedBadgeIdFromURL);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              matchedUser = { id: docSnap.id, ...docSnap.data() };
            }
          }
        }

        if (!matchedUser) {
          const q = query(collection(db, 'users'), where('email', '==', isAdmin ? 'admin@gmail.com' : loginEmail));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            matchedUser = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          }
        }

        if (matchedUser) {
          const userData = {
            ...matchedUser,
            ...(matchedUser.workInfo || {}),
            ...(matchedUser.bankInfo || {})
          };
          setU(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUserData();
  }, [clickedBadgeIdFromURL, loginEmail, isAdmin]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const InfoItem = ({ Icon, label, value, className = '' }) => {
    if (!value) return null;
    return (
      <div className={`info-item ${className}`}>
        <div className="info-label">
          {Icon && <Icon className="info-icon" />}
          <span>{label}</span>
        </div>
        <div className="info-value">{value}</div>
      </div>
    );
  };

  return (
    <>
      <NavbarTopbar />
      <div className="about-container mt-5">
     
     <div className="profile-header">
  <div className="profile-left">
    <div className="profile-avatar">
      <FaUserCircle className="avatar-icon" />
    </div>
    <h2 className="profile-name">
      {u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Loading...'}
    </h2>
    <div className="profile-id">
      Badge ID: <span>{u?.badgeId || 'N/A'}</span>
    </div>
  </div>
<div className="profile-right-row">
  <div className="contact-column">
    <InfoItem Icon={FaEnvelope} label="Work Email" value={u?.workEmail} className="contact-info-item" />
    <InfoItem Icon={FaEnvelope} label="Personal Email" value={u?.email} className="contact-info-item" />
  </div>

  {/* Right Column */}
  <div className="contact-column">
    <InfoItem Icon={FaPhone} label="Work Phone" value={u?.workPhone} className="contact-info-item" />
    <InfoItem Icon={FaPhone} label="Personal Phone" value={u?.phone} className="contact-info-item" />
  </div>
</div>

</div>


        {/* Tabs */}
        <div className="profile-tabs-container">
          <nav className="profile-tabs">
            {['/about', '/attendance', '/leave', '/employeepayroll', '/employeedashboard'].map(path => (
              <NavLink
                key={path}
                to={`${path}/${u?.badgeId || u?.id || ''}`}
                className={({ isActive }) => `profile-tab ${isActive ? 'active' : ''}`}
              >
                {path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sections */}
        <div className="profile-sections">
          {/* Personal Info */}
          <div className="profile-section">
            <div className="section-header">
              <FaUserCircle className="section-icon" />
              <h3>Personal Information</h3>
            </div>
            <div className="section-content">
              <div className="info-grid">
                <InfoItem Icon={FaCalendarAlt} label="Date of Birth" value={formatDate(u?.dob)} />
                <InfoItem Icon={FaVenusMars} label="Gender" value={u?.gender} />
                <InfoItem Icon={FaMapMarkerAlt} label="Address" value={u?.address} />
                <InfoItem Icon={FaLocationArrow} label="State" value={u?.state} />
                <InfoItem Icon={FaCity} label="City" value={u?.city} />
                <InfoItem Icon={FaPhone} label="Emergency Contact" value={u?.emergencyContactNumber} />
                <InfoItem Icon={FaAddressCard} label="Emergency Name" value={u?.emergencyContactName} />
                <InfoItem Icon={FaAddressCard} label="Emergency Relation" value={u?.emergencyContactRelation} />
                <InfoItem Icon={FaUniversity} label="Qualifications" value={u?.qualifications} />
                <InfoItem label="Experience" value={u?.experience} />
                <InfoItem label="Marital Status" value={u?.maritalStatus} />
              </div>
            </div>
          </div>

          {/* Work Info */}
          <div className="profile-section">
            <div className="section-header">
              <FaBriefcase className="section-icon" />
              <h3>Work Information</h3>
            </div>
            <div className="section-content">
              <div className="info-grid">
                <InfoItem Icon={FaBuilding} label="Departments" value={u?.departments} />
                <InfoItem Icon={FaUserTie} label="Reporting Manager" value={u?.reportingManager} />
                <InfoItem Icon={FaBriefcase} label="Shift" value={u?.shift} />
                <InfoItem Icon={FaTags} label="Employee Tag" value={u?.employeeTag} />
                <InfoItem Icon={FaSuitcase} label="Work Type" value={u?.workType} />
                <InfoItem Icon={FaSuitcase} label="Employment Type" value={u?.employmentType} />
                <InfoItem Icon={FaBriefcase} label="Job Position" value={u?.jobPosition} />
                <InfoItem Icon={FaBriefcase} label="Job Level" value={u?.jobLevel} />
                <InfoItem Icon={FaBriefcase} label="Job Role" value={u?.jobRole} />
                <InfoItem Icon={FaMapMarkerAlt} label="Work Location" value={u?.workLocation} />
                <InfoItem Icon={FaCalendarAlt} label="Joining Date" value={formatDate(u?.joiningDate)} />
                <InfoItem Icon={FaCalendarAlt} label="Ending Date" value={formatDate(u?.endingDate)} />
                <InfoItem Icon={FaMoneyBillWave} label="Basic Salary" value={u?.basicSalary} />
              </div>
            </div>
          </div>

          {/* Bank Info */}
          <div className="profile-section bank-info">
            <div className="section-header">
              <FaLandmark className="section-icon" />
              <h3>Bank Information</h3>
            </div>
            <div className="section-content">
              <div className="info-grid">
                <InfoItem Icon={FaLandmark} label="Bank Name" value={u?.bankName} />
                <InfoItem Icon={FaIdCard} label="Account Number" value={u?.accountNumber} />
                <InfoItem Icon={FaBuilding} label="Branch" value={u?.branch} />
                <InfoItem Icon={FaIdCard} label="IFSC Code" value={u?.ifsc} />
                <InfoItem Icon={FaMapMarkerAlt} label="Bank Address" value={u?.address} />
                <InfoItem Icon={FaLocationArrow} label="Bank State" value={u?.state} />
                <InfoItem Icon={FaCity} label="Bank City" value={u?.city} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
