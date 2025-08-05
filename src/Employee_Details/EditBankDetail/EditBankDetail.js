import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import { db } from '../Firebase/Firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import './EditBankDetail.css';
import NavbarTopbar from '../Navbar/NavbarTopbar';

const EditBankDetail = () => {
  const { badgeId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();

  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    branch: '',
    ifsc: '',
    address: '',
    state: '',
    city: ''
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const isAdmin = currentUser.email === 'admin@gmail.com';
          
          const q = query(collection(db, 'users'), where('badgeId', '==', badgeId));
          const querySnapshot = await getDocs(q);
          
          let userData = {};
          if (!querySnapshot.empty) {
            userData = querySnapshot.docs[0].data();
          } else {
            const docRef = doc(db, 'users', badgeId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              userData = docSnap.data();
            }
          }
          
          setCanEdit(isAdmin || currentUser.email === userData.email);
        } catch (err) {
          console.error('Error checking permissions:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, badgeId]);

  useEffect(() => {
    const fetchBankData = async () => {
      try {
        const q = query(collection(db, 'users'), where('badgeId', '==', badgeId));
        const querySnapshot = await getDocs(q);
        
        let userData = {};
        if (!querySnapshot.empty) {
          userData = querySnapshot.docs[0].data();
        } else {
          const docRef = doc(db, 'users', badgeId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            userData = docSnap.data();
          }
        }

        setFormData({
          bankName: userData.bankName || '',
          accountNumber: userData.accountNumber || '',
          branch: userData.branch || '',
          ifsc: userData.ifsc || '',
          address: userData.address || '',
          state: userData.state || '',
          city: userData.city || ''
        });
      } catch (error) {
        console.error('Error fetching bank data:', error);
      }
    };

    fetchBankData();
  }, [badgeId]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
      navigate('/employee');
    } catch (error) {
      console.error('Error updating bank info:', error);
      alert('Failed to update bank info. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="edit-bankdetail-container mt-4">Loading...</div>;

  return (
    <>
    <NavbarTopbar />
    <div className="edit-bankdetail-container">
      <div className="edit-bankdetail-tabs">
        <NavLink to={`/Editaddemployee/${badgeId}`} className="edit-bankdetail-tab">
          Personal Info
        </NavLink>
        <NavLink to={`/Editworkdetail/${badgeId}`} className="edit-bankdetail-tab">
          Work Info
        </NavLink>
        <NavLink to={`/Editbankdetail/${badgeId}`} className="edit-bankdetail-tab active">
          Bank Info
        </NavLink>
      </div>

      <div className="edit-bankdetail-card">
        <h4 className="edit-bankdetail-title">Bank Information</h4>
        <form onSubmit={handleSubmit} className="edit-bankdetail-form">
          <div className="row g-3">
            {[
              { label: 'Bank Name', name: 'bankName' },
              { label: 'Account Number', name: 'accountNumber' },
              { label: 'Branch', name: 'branch' },
              { label: 'Bank IFSC Code', name: 'ifsc' },
              { label: 'Address', name: 'address' },
              { label: 'State', name: 'state' },
              { label: 'City', name: 'city' }
            ].map(({ label, name }) => (
              <div className="col-md-6" key={name}>
                <label className="form-label">{label}</label>
                <input
                  type="text"
                  name={name}
                  className="form-control"
                  value={formData[name] || ''}
                  onChange={handleChange}
                  disabled={!canEdit}
                  required
                />
              </div>
            ))}
          </div>

          <div className="text-end mt-4">
            <button 
              type="submit" 
              className="edit-bankdetail-submit-btn"
              disabled={isSubmitting || !canEdit}
            >
              {isSubmitting ? 'Saving...' : 'Save & Finish'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default EditBankDetail;