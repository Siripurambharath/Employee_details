import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import './Settings.css';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const collectionLabels = {
  departments: 'Department',
  jobPositions: 'Job Positions',
  jobRoles: 'Job Roles',
  workTypes: 'Work Types',
  employmentTypes: 'Employment Types',
};

const collections = Object.keys(collectionLabels);
const ITEMS_PER_PAGE = 5;

const Settings = () => {
  const [data, setData] = useState({});
  const [editState, setEditState] = useState({});
  const [newEntries, setNewEntries] = useState({});
  const [page, setPage] = useState({});
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState({});

  const fetchAll = async () => {
    setLoading(true);
    try {
      const allData = {};
      for (const col of collections) {
        const snapshot = await getDocs(collection(db, col));
        allData[col] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      setData(allData);
      const defaultPages = {};
      for (const col of collections) {
        defaultPages[col] = 1;
      }
      setPage(defaultPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleEdit = (col, id, name) => {
    setEditState({ [`${col}-${id}`]: name });
  };

  const handleCancelEdit = (col, id) => {
    setEditState(prev => {
      const updated = { ...prev };
      delete updated[`${col}-${id}`];
      return updated;
    });
  };

  const handleInputChange = (col, id, value) => {
    setEditState(prev => ({ ...prev, [`${col}-${id}`]: value }));
  };

  const handleUpdate = async (col, id) => {
    setOperationLoading(prev => ({ ...prev, [`${col}-${id}-update`]: true }));
    try {
      const newName = editState[`${col}-${id}`].trim();
      const oldItem = data[col].find(item => item.id === id);
      const oldName = oldItem?.name?.trim();

      if (!newName || !oldName || newName === oldName) return;

      // ✅ Step 1: Update collection item
      await updateDoc(doc(db, col, id), { name: newName });

      // ✅ Step 2: Map to user field
      const fieldMap = {
        departments: 'departments',
        jobPositions: 'jobPosition',
        jobRoles: 'jobRole',
        workTypes: 'workType',
        employmentTypes: 'employmentType',
      };
      const userField = fieldMap[col];
      if (!userField) return;

      // ✅ Step 3: Update users who have old name
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where(userField, '==', oldName));
      const matchedUsersSnapshot = await getDocs(q);

      const batchUpdates = matchedUsersSnapshot.docs.map(userDoc => {
        const userRef = doc(db, 'users', userDoc.id);
        return updateDoc(userRef, { [userField]: newName });
      });

      await Promise.all(batchUpdates);

      handleCancelEdit(col, id);
      await fetchAll();
    } catch (error) {
      console.error("Error updating:", error);
    } finally {
      setOperationLoading(prev => ({ ...prev, [`${col}-${id}-update`]: false }));
    }
  };

  const handleDelete = async (col, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    setOperationLoading(prev => ({ ...prev, [`${col}-${id}-delete`]: true }));
    try {
      await deleteDoc(doc(db, col, id));
      await fetchAll();
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setOperationLoading(prev => ({ ...prev, [`${col}-${id}-delete`]: false }));
    }
  };

  const handleNewInputChange = (col, value) => {
    setNewEntries(prev => ({ ...prev, [col]: value }));
  };

  const handleAddNew = async (col) => {
    setOperationLoading(prev => ({ ...prev, [`${col}-add`]: true }));
    try {
      const value = newEntries[col]?.trim();
      if (value) {
        await addDoc(collection(db, col), { name: value, type: col });
        setNewEntries(prev => ({ ...prev, [col]: '' }));
        await fetchAll();
      }
    } catch (error) {
      console.error("Error adding:", error);
    } finally {
      setOperationLoading(prev => ({ ...prev, [`${col}-add`]: false }));
    }
  };

  const handlePageChange = (col, direction) => {
    setPage(prev => ({
      ...prev,
      [col]: Math.max(1, prev[col] + direction),
    }));
  };

  const paginate = (col) => {
    const currentPage = page[col] || 1;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return data[col]?.slice(start, end) || [];
  };

  const totalPages = (col) => {
    return Math.ceil((data[col]?.length || 0) / ITEMS_PER_PAGE);
  };

  return (
    <>
      <NavbarTopbar />
      <div className="settings-container mt-4">
        {loading ? (
          <div className="loading-container">
            <ClipLoader color="#4e73df" size={50} />
            <p className="loading-text">Loading settings...</p>
          </div>
        ) : (
          <div className="settings-grid">
            {collections.map((col) => (
              <div className="settings-card" key={col}>
                <div className="card-header">
                  <h3>{collectionLabels[col]}</h3>
                </div>
                <div className="card-body">
                  <div className="add-item-form">
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Add new ${collectionLabels[col].toLowerCase()}`}
                      value={newEntries[col] || ''}
                      onChange={(e) => handleNewInputChange(col, e.target.value)}
                      disabled={operationLoading[`${col}-add`]}
                    />
                    <button
                      className="btn-primary"
                      onClick={() => handleAddNew(col)}
                      disabled={operationLoading[`${col}-add`] || !newEntries[col]?.trim()}
                    >
                      {operationLoading[`${col}-add`] ? (
                        <ClipLoader size={15} color="#fff" />
                      ) : (
                        <FaPlus />
                      )}
                    </button>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Name</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginate(col).map((item, index) => (
                          <tr key={item.id}>
                            <td>{(page[col] - 1) * ITEMS_PER_PAGE + index + 1}</td>
                            <td>
                              {editState[`${col}-${item.id}`] !== undefined ? (
                                <input
                                  type="text"
                                  value={editState[`${col}-${item.id}`]}
                                  onChange={(e) => handleInputChange(col, item.id, e.target.value)}
                                  className="edit-input"
                                  disabled={operationLoading[`${col}-${item.id}-update`]}
                                />
                              ) : (
                                <span className="item-name">{item.name}</span>
                              )}
                            </td>
                            <td className="actions">
                              {editState[`${col}-${item.id}`] !== undefined ? (
                                <>
                                  <button
                                    className="btn-success"
                                    onClick={() => handleUpdate(col, item.id)}
                                    disabled={operationLoading[`${col}-${item.id}-update`]}
                                  >
                                    {operationLoading[`${col}-${item.id}-update`] ? (
                                      <ClipLoader size={15} color="#fff" />
                                    ) : <FaCheck />}
                                  </button>
                                  <button
                                    className="btn-cancel"
                                    onClick={() => handleCancelEdit(col, item.id)}
                                  >
                                    <FaTimes />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn-edit"
                                    onClick={() => handleEdit(col, item.id, item.name)}
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    className="btn-delete"
                                    onClick={() => handleDelete(col, item.id)}
                                    disabled={operationLoading[`${col}-${item.id}-delete`]}
                                  >
                                    {operationLoading[`${col}-${item.id}-delete`] ? (
                                      <ClipLoader size={15} color="#fff" />
                                    ) : <FaTrash />}
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                        {paginate(col).length === 0 && (
                          <tr><td colSpan="3" className="no-data">No data available</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages(col) > 1 && (
                    <div className="pagination">
                      <button
                        className="pagination-btn"
                        disabled={page[col] === 1}
                        onClick={() => handlePageChange(col, -1)}
                      >
                        Previous
                      </button>
                      <span className="page-info">Page {page[col]} of {totalPages(col)}</span>
                      <button
                        className="pagination-btn"
                        disabled={page[col] === totalPages(col)}
                        onClick={() => handlePageChange(col, 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Settings;
