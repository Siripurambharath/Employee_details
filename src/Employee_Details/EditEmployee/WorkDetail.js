import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Navbar from '../Navbar/NavbarTopbar';
import './WorkDetail.css';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from '../Firebase/Firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const WorkDetail = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    departments: '', jobPosition: '', jobLevel: '', jobRole: '',
    reportingManager: '', shift: '', workType: '', employmentType: '',
    employeeTag: '', workLocation: '', workEmail: '', workPhone: '',
    joiningDate: '', endingDate: '', basicSalary: ''
  });

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [reportingManagers, setReportingManagers] = useState([]);
  const [modalState, setModalState] = useState({ show: false, field: '', title: '', newValue: '' });

  useEffect(() => {
    const personalInfo = localStorage.getItem('personalInfo');
    if (!personalInfo) {
      navigate('/addemployee');
      return;
    }
    const savedWorkInfo = localStorage.getItem('workInfo');
    if (savedWorkInfo) setFormData(JSON.parse(savedWorkInfo));

    fetchData('departments', setDepartments);
    fetchData('jobPositions', setPositions);
    fetchData('jobRoles', setJobRoles);
    fetchData('workTypes', setWorkTypes);
    fetchData('employmentTypes', setEmploymentTypes);
    fetchReportingManagers();
  }, [navigate]);

  const fetchData = async (collectionName, setter) => {
    const snapshot = await getDocs(collection(db, collectionName));
    setter(snapshot.docs.map(doc => doc.data().name));
  };

  const fetchReportingManagers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs
      .map(doc => doc.data())
      .filter(data =>
        data.firstName && data.badgeId &&
        data.jobRole && data.jobRole.toLowerCase() === 'manager'
      )
      .map(data => ({
        firstName: data.firstName.trim(),
        badgeId: data.badgeId.trim()
      }));
    setReportingManagers(users);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };

    // Auto-set reportingManager to Admin if jobRole is Manager
    if (name === 'jobRole' && value.toLowerCase() === 'manager') {
      updatedData.reportingManager = 'Admin';
    }

    setFormData(updatedData);
    localStorage.setItem('workInfo', JSON.stringify(updatedData));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.departments || !formData.jobPosition || !formData.employmentType) {
      return alert('Departments, Job Position, and Employment Type are required');
    }
    localStorage.setItem('workInfo', JSON.stringify(formData)); // Ensures Admin value is saved too
    navigate('/bankdetail');
  };

  const openModal = (field, title) => {
    setModalState({ show: true, field, title, newValue: '' });
  };
  const closeModal = () => setModalState({ ...modalState, show: false });

  const handleAddNew = async () => {
    const { field, newValue } = modalState;
    if (!newValue.trim()) return;

    const collectionMap = {
      departments: 'departments',
      jobPosition: 'jobPositions',
      jobRole: 'jobRoles',
      workType: 'workTypes',
      employmentType: 'employmentTypes',
    };
    const collectionName = collectionMap[field];
    if (!collectionName) return;

    await addDoc(collection(db, collectionName), { name: newValue, type: field });

    const setterMap = {
      departments: setDepartments,
      jobPosition: setPositions,
      jobRole: setJobRoles,
      workType: setWorkTypes,
      employmentType: setEmploymentTypes,
    };
    fetchData(collectionName, setterMap[field]);
    setFormData({ ...formData, [field]: newValue });
    closeModal();
  };

  return (
    <>
      <Navbar />
      <div className="work-detail-container container mt-4">
        <div className="edit-tabs d-flex gap-3 mb-3">
          <NavLink to="/addemployee" className={({ isActive }) => isActive ? 'edit-tabs-link active' : 'edit-tabs-link'}>Personal Info</NavLink>
          <NavLink to="/workdetail" className={({ isActive }) => isActive ? 'edit-tabs-link active' : 'edit-tabs-link'}>Work Info</NavLink>
          <NavLink to="/bankdetail" className={({ isActive }) => isActive ? 'edit-tabs-link active' : 'edit-tabs-link'}>Bank Info</NavLink>
        </div>

        <div className="card shadow-sm p-4">
          <h4 className="fw-bold mb-4">Work Info</h4>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">

              {/* Departments */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between">
                  <span>Departments</span>
                  <span className="text-primary" role="button" onClick={() => openModal('departments', 'Add New Departments')}>➕</span>
                </label>
                <select name="departments" className="form-select" value={formData.departments} onChange={handleChange} required>
                  <option value="">Select Departments</option>
                  {departments.map((d, idx) => <option key={idx} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Job Position */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between">
                  <span>Job Position</span>
                  <span className="text-primary" role="button" onClick={() => openModal('jobPosition', 'Add New Job Position')}>➕</span>
                </label>
                <select name="jobPosition" className="form-select" value={formData.jobPosition} onChange={handleChange} required>
                  <option value="">Select Job Position</option>
                  {positions.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Job Level */}
              <div className="col-md-6">
                <label className="form-label">Job Level</label>
                <select name="jobLevel" className="form-select" value={formData.jobLevel} onChange={handleChange}>
                  <option value="">Select Job Level</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              {/* Job Role */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between">
                  <span>Job Role</span>
                  <span className="text-primary" role="button" onClick={() => openModal('jobRole', 'Add New Job Role')}>➕</span>
                </label>
                <select name="jobRole" className="form-select" value={formData.jobRole} onChange={handleChange}>
                  <option value="">Select Job Role</option>
                  {jobRoles.map((r, idx) => <option key={idx} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Reporting Manager */}
              <div className="col-md-6">
                <label className="form-label">Reporting Manager</label>
                <select
                  name="reportingManager"
                  className="form-select"
                  value={formData.reportingManager}
                  onChange={handleChange}
                  disabled={formData.jobRole.toLowerCase() === 'manager'}
                >
                  <option value="">Select Manager</option>
                  {reportingManagers.map((mgr, idx) => (
                    <option key={idx} value={`${mgr.firstName} (${mgr.badgeId})`}>
                      {mgr.firstName} ({mgr.badgeId})
                    </option>
                  ))}
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Shift */}
              <div className="col-md-6">
                <label className="form-label">Shift</label>
                <select name="shift" className="form-select" value={formData.shift} onChange={handleChange}>
                  <option value="">Select Shift</option>
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>

              {/* Work Type */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between">
                  <span>Work Type</span>
                  <span className="text-primary" role="button" onClick={() => openModal('workType', 'Add New Work Type')}>➕</span>
                </label>
                <select name="workType" className="form-select" value={formData.workType} onChange={handleChange}>
                  <option value="">Select Work Type</option>
                  {workTypes.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Employment Type */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between">
                  <span>Employment Type</span>
                  <span className="text-primary" role="button" onClick={() => openModal('employmentType', 'Add New Employment Type')}>➕</span>
                </label>
                <select name="employmentType" className="form-select" value={formData.employmentType} onChange={handleChange} required>
                  <option value="">Select Employment Type</option>
                  {employmentTypes.map((e, idx) => <option key={idx} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Other Fields */}
              <div className="col-md-6"><label className="form-label">Employee Tag</label><input type="text" name="employeeTag" className="form-control" value={formData.employeeTag} onChange={handleChange} /></div>
              <div className="col-md-6"><label className="form-label">Work Location</label><input type="text" name="workLocation" className="form-control" value={formData.workLocation} onChange={handleChange} /></div>
              <div className="col-md-6"><label className="form-label">Work Email</label><input type="email" name="workEmail" className="form-control" value={formData.workEmail} onChange={handleChange} /></div>
              <div className="col-md-6"><label className="form-label">Work Phone</label><input type="text" name="workPhone" className="form-control" value={formData.workPhone} onChange={handleChange} /></div>
              <div className="col-md-6"><label className="form-label">Joining Date</label><input type="date" name="joiningDate" className="form-control" value={formData.joiningDate} onChange={handleChange} /></div>
              <div className="col-md-6"><label className="form-label">Ending Date</label><input type="date" name="endingDate" className="form-control" value={formData.endingDate} onChange={handleChange} /></div>
              <div className="col-md-6"><label className="form-label">Basic Salary</label><input type="number" name="basicSalary" className="form-control" value={formData.basicSalary} onChange={handleChange} /></div>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/addemployee')}>Back</button>
              <button type="submit" className="btn btn-primary">Save and Continue</button>
            </div>
          </form>
        </div>
      </div>

      <Modal show={modalState.show} onHide={closeModal}>
        <Modal.Header closeButton><Modal.Title>{modalState.title}</Modal.Title></Modal.Header>
        <Modal.Body>
          <input type="text" className="form-control" value={modalState.newValue} onChange={(e) => setModalState({ ...modalState, newValue: e.target.value })} placeholder={`Enter ${modalState.field}`} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={handleAddNew}>Add</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default WorkDetail;
