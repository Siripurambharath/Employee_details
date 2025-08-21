import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import './AdminStaff.css';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const AdminStaff = () => {
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null); // track accordion

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const usersRef = collection(db, 'users');
        const managersQuery = query(usersRef, where('jobRole', '==', 'Manager'));
        const managersSnapshot = await getDocs(managersQuery);

        const managersData = [];

        for (const managerDoc of managersSnapshot.docs) {
          const manager = managerDoc.data();
          const managerBadgeId = manager.badgeId || '';
          const reportingManagerPattern = new RegExp(`\\((${managerBadgeId})\\)`, 'i');

          const employeesQuery = query(usersRef);
          const employeesSnapshot = await getDocs(employeesQuery);

          const employees = employeesSnapshot.docs
            .filter(doc => {
              const emp = doc.data();
              return emp.reportingManager && 
                     (emp.reportingManager.includes(managerBadgeId) || 
                      reportingManagerPattern.test(emp.reportingManager));
            })
            .map(doc => {
              const emp = doc.data();
              return {
                badgeId: emp.badgeId || '',
                name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
                department: emp.departments || '',
                jobPosition: emp.jobPosition || '',
                workEmail: emp.workEmail || ''
              };
            });

          managersData.push({
            manager: {
              name: `${manager.firstName || ''} ${manager.lastName || ''}`.trim(),
              badgeId: managerBadgeId
            },
            employees
          });
        }

        setStaffData(managersData);
      } catch (error) {
        console.error('Error fetching staff data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading staff data...</p>
      </div>
    );
  }

  return (
    <>
      <NavbarTopbar />
      <div className="admin-staff-container mt-4">
        <h1 className="page-title">Managers </h1>

        {staffData.map((group, index) => (
          <div key={index} className="manager-group">
            <div 
              className="manager-header accordion-toggle" 
              onClick={() => toggleAccordion(index)}
            >
              <span className="manager-label">Manager: </span>
              <span className="manager-name">{group.manager.name}</span>
              <span className="manager-badge"> (ID: {group.manager.badgeId})</span>
              <span className="accordion-arrow">{openIndex === index ? '▲' : '▼'}</span>
            </div>

            {openIndex === index && (
              <table className="staff-table">
                <thead className='staff-table-head'>
                  <tr>
                    <th>Badge ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Job Position</th>
                  </tr>
                </thead>
                <tbody>
                  {group.employees.length > 0 ? (
                    group.employees.map((employee, empIndex) => (
                      <tr key={empIndex}>
                        <td className="badge-id">{employee.badgeId}</td>
                        <td>{employee.name}</td>
                        <td>{employee.department}</td>
                        <td>{employee.jobPosition}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center' }}>
                        No employees assigned
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default AdminStaff;
