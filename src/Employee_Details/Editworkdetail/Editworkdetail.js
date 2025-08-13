import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { db } from '../Firebase/Firebase';
import {
  doc, getDocs, collection, addDoc, updateDoc, query, where, getDoc
} from 'firebase/firestore';
import { Modal, Button } from 'react-bootstrap';
import './Editworkdetail.css';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const Editworkdetail = () => {
  const { badgeId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    departments: '', jobPosition: '', jobRole: '', reportingManager: '',
    shift: '', workType: '', employmentType: '', employeeTag: '',
    workLocation: '', workEmail: '', workPhone: '', joiningDate: '',
    endingDate: '', basicSalary: '', jobLevel: ''
  });

  const [dropdownData, setDropdownData] = useState({
    departments: [], jobPositions: [], jobRoles: [],
    workTypes: [], employmentTypes: [], reportingManagers: []
  });

  const [docId, setDocId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, field: '', title: '', newValue: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (badgeId) fetchData();
  }, [badgeId]);

  const fetchDropdownOptions = async (collectionName) => {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.docs.map(doc => doc.data().name);
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      return [];
    }
  };

  const fetchReportingManagers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            badgeId: data.badgeId,
            firstName: data.firstName,
            lastName: data.lastName
          };
        })
        .filter(u => u.firstName);
    } catch (error) {
      console.error("Error fetching reporting managers:", error);
      return [];
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(collection(db, 'users'), where('badgeId', '==', badgeId));
      const querySnap = await getDocs(q);

      let userData = {};
      let userDocId = '';

      if (!querySnap.empty) {
        const docItem = querySnap.docs[0];
        userData = docItem.data();
        userDocId = docItem.id;
      } else {
        const docRef = doc(db, 'users', badgeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          userData = docSnap.data();
          userDocId = docSnap.id;
        }
      }

      if (userDocId) {
        setFormData({
          departments: userData.departments || '',
          jobPosition: userData.jobPosition || '',
          jobRole: userData.jobRole || '',
          reportingManager: userData.reportingManager || '',
          shift: userData.shift || '',
          workType: userData.workType || '',
          employmentType: userData.employmentType || '',
          employeeTag: userData.employeeTag || '',
          workLocation: userData.workLocation || '',
          workEmail: userData.workEmail || '',
          workPhone: userData.workPhone || '',
          joiningDate: userData.joiningDate || '',
          endingDate: userData.endingDate || '',
          basicSalary: userData.basicSalary || '',
          jobLevel: userData.jobLevel || ''
        });
        setDocId(userDocId);
      } else {
        setError(`No user found with badgeId: ${badgeId}`);
      }

      const [
        departments, jobPositions, jobRoles,
        workTypes, employmentTypes, reportingManagers
      ] = await Promise.all([
        fetchDropdownOptions('departments'),
        fetchDropdownOptions('jobPositions'),
        fetchDropdownOptions('jobRoles'),
        fetchDropdownOptions('workTypes'),
        fetchDropdownOptions('employmentTypes'),
        fetchReportingManagers()
      ]);

      setDropdownData({
        departments, jobPositions, jobRoles,
        workTypes, employmentTypes, reportingManagers
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

const handleChange = (e) => {
  const { name, value } = e.target;
  let updated = { ...formData, [name]: value };

  if (name === 'jobRole') {
    if (value.toLowerCase() === 'manager') {
      updated.reportingManager = 'Admin';
    } else if (formData.reportingManager === 'Admin') {
      updated.reportingManager = ''; 
    }
  }

  setFormData(updated);
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', docId);
      const cleanedData = Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, v || '']));
      await updateDoc(userRef, cleanedData);
      navigate(`/Editbankdetail/${badgeId}`);
    } catch (error) {
      console.error('Error saving work info:', error);
      alert('Failed to save work info. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (field, title) => {
    setModalState({ isOpen: true, field, title, newValue: '' });
  };

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false, newValue: '' });
  };

  const handleAddNew = async () => {
    const { field, newValue } = modalState;
    if (!newValue.trim()) return;

    const collectionMap = {
      departments: 'departments',
      jobPosition: 'jobPositions',
      jobRole: 'jobRoles',
      workType: 'workTypes',
      employmentType: 'employmentTypes'
    };

    const collectionName = collectionMap[field];
    if (!collectionName) return;

    try {
      await addDoc(collection(db, collectionName), { name: newValue });
      const updatedOptions = await fetchDropdownOptions(collectionName);
      setDropdownData(prev => ({ ...prev, [field + 's']: updatedOptions }));
      setFormData(prev => ({ ...prev, [field]: newValue }));
      closeModal();
    } catch (error) {
      console.error("Error adding new option:", error);
      alert("Failed to add new option");
    }
  };

  if (loading) return <div className="edit-workdetail-container mt-4">Loading...</div>;

  if (error) return (
    <div className="edit-workdetail-container mt-4">
      <div className="alert alert-danger">{error}</div>
      <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <>
      <NavbarTopbar />
      <div className="edit-workdetail-container mt-4">
        <div className="edit-workdetail-tabs">
          <NavLink to={`/Editaddemployee/${badgeId}`} className="edit-workdetail-tab">Personal Info</NavLink>
          <NavLink to={`/Editworkdetail/${badgeId}`} className="edit-workdetail-tab active">Work Info</NavLink>
          <NavLink to={`/Editbankdetail/${badgeId}`} className="edit-workdetail-tab">Bank Info</NavLink>
        </div>

        <div className="edit-workdetail-card">
          <h4 className="edit-workdetail-title">Work Info</h4>
          <form onSubmit={handleSubmit} className="edit-workdetail-form">
            <div className="row g-3">
              {/* Departments */}
              <div className="col-md-6">
                <label className="form-label">
                  Departments
                  <span className="edit-workdetail-add-new" onClick={() => openModal('departments', 'Add New Departments')}>➕ Add New</span>
                </label>
                <select name="departments" className="form-select" value={formData.departments} onChange={handleChange}>
                  <option value="">Select</option>
                  {dropdownData.departments.map((item, idx) => (
                    <option key={idx} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              {/* Job Position */}
              <div className="col-md-6">
                <label className="form-label">
                  Job Position
                  <span className="edit-workdetail-add-new" onClick={() => openModal('jobPosition', 'Add New Job Position')}>➕ Add New</span>
                </label>
                <select name="jobPosition" className="form-select" value={formData.jobPosition} onChange={handleChange}>
                  <option value="">Select</option>
                  {dropdownData.jobPositions.map((item, idx) => (
                    <option key={idx} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              {/* Job Level */}
              <div className="col-md-6">
                <label className="form-label">Job Level</label>
                <select
                  name="jobLevel"
                  className="form-select"
                  value={formData.jobLevel}
                  onChange={handleChange}
                >
                  <option value="">Select Job Level</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              {/* Job Role */}
              <div className="col-md-6">
                <label className="form-label">
                  Job Role
                  <span className="edit-workdetail-add-new" onClick={() => openModal('jobRole', 'Add New Job Role')}>➕ Add New</span>
                </label>
                <select name="jobRole" className="form-select" value={formData.jobRole} onChange={handleChange}>
                  <option value="">Select</option>
                  {dropdownData.jobRoles.map((item, idx) => (
                    <option key={idx} value={item}>{item}</option>
                  ))}
                </select>
              </div>

           <div className="col-md-6">
  <label className="form-label">Reporting Manager</label>
  {formData.jobRole.toLowerCase() === 'manager' ? (
    <input
      type="text"
      name="reportingManager"
      className="form-control"
      value="Admin"
      disabled
    />
  ) : (
    <select
      name="reportingManager"
      className="form-select"
      value={formData.reportingManager}
      onChange={handleChange}
    >
      <option value="">Select</option>
      {dropdownData.reportingManagers.map((mgr, idx) => (
        <option key={idx} value={mgr.badgeId}>
          {mgr.firstName} {mgr.lastName} ({mgr.badgeId})
        </option>
      ))}
    </select>
  )}
</div>


              {/* Remaining Inputs */}
              {[{ label: 'Shift', name: 'shift', type: 'select', options: ['Morning', 'Evening', 'Night'] },
                { label: 'Employee Tag', name: 'employeeTag' },
                { label: 'Work Location', name: 'workLocation' },
                { label: 'Work Email', name: 'workEmail', type: 'email' },
                { label: 'Work Phone', name: 'workPhone' },
                { label: 'Joining Date', name: 'joiningDate', type: 'date' },
                { label: 'Ending Date', name: 'endingDate', type: 'date' },
                { label: 'Basic Salary', name: 'basicSalary', type: 'number' }
              ].map(({ label, name, type = 'text', options = [] }) => (
                <div className="col-md-6" key={name}>
                  <label className="form-label">{label}</label>
                  {type === 'select' ? (
                    <select name={name} className="form-select" value={formData[name]} onChange={handleChange}>
                      <option value="">Select</option>
                      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={type}
                      name={name}
                      className="form-control"
                      value={formData[name] || ''}
                      onChange={handleChange}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="text-end mt-4">
              <button type="submit" className="btn btn-primary edit-workdetail-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save & Next'}
              </button>
            </div>
          </form>
        </div>

        <Modal show={modalState.isOpen} onHide={closeModal} className="edit-workdetail-modal">
          <Modal.Header closeButton>
            <Modal.Title>{modalState.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <input
              type="text"
              className="form-control"
              value={modalState.newValue}
              onChange={(e) => setModalState({ ...modalState, newValue: e.target.value })}
              placeholder={`Enter ${modalState.title}`}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleAddNew}>Add</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default Editworkdetail;
