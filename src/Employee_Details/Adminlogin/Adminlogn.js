import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import companylogo from '../Image/companylogo.png';

const Adminlogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const togglePassword = () => setShowPassword(!showPassword);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dummyAdmin = {
      fullname: 'Admin',
      email: 'admin@gmail.com',
      password: 'admin@123',
    };

    const enteredFullname = formData.fullname.trim().toLowerCase();
    const enteredEmail = formData.email.trim().toLowerCase();
    const enteredPassword = formData.password;

    // ✅ Admin login check
    if (
      enteredFullname === dummyAdmin.fullname.toLowerCase() &&
      enteredEmail === dummyAdmin.email.toLowerCase() &&
      enteredPassword === dummyAdmin.password
    ) {
      localStorage.setItem('email', dummyAdmin.email);
      localStorage.removeItem('badgeId');
      setSuccess('✅ Admin login successful!');
      setError('');
      navigate('/employee');
      return;
    }

    // ✅ Employee login check
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const matched = users.find(user =>
        user.email?.toLowerCase() === enteredEmail &&
        user.password === enteredPassword
      );

      if (matched) {
        localStorage.setItem('email', matched.email);
        localStorage.setItem('badgeId', matched.badgeId);
        setSuccess('✅ Employee login successful!');
        setError('');
        navigate('/employee');
      } else {
        setError('Invalid employee credentials');
        setSuccess('');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Something went wrong.');
      setSuccess('');
    }
  };

  const styles = {
    wrapper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
    },
    container: {
      maxWidth: '400px',
      width: '90%',
      padding: '25px',
      background: '#fff',
      borderRadius: '10px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    },
    logoHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '20px',
    },
    logo: {
      width: '100px',
      height: '60px',
      borderRadius: '50%',
      objectFit: 'cover',
    },
    inputGroup: {
      position: 'relative',
      marginBottom: '20px',
    },
    icon: {
      position: 'absolute',
      top: '50%',
      left: '10px',
      transform: 'translateY(-50%)',
      color: '#555',
    },
    input: {
      width: '100%',
      padding: '10px 40px 10px 35px',
      border: '1px solid #ccc',
      borderRadius: '5px',
    },
    eyeIcon: {
      position: 'absolute',
      top: '50%',
      right: '10px',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: '#555',
    },
    button: {
      width: '100%',
      padding: '10px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
    },
    error: { color: 'red', marginBottom: '10px', textAlign: 'center' },
    success: { color: 'green', marginBottom: '10px', textAlign: 'center' },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.logoHeader}>
          <img src={companylogo} alt="Logo" style={styles.logo} />
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <FaUser style={styles.icon} />
            <input
              type="text"
              name="fullname"
              placeholder="Name"
              value={formData.fullname}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <FaEnvelope style={styles.icon} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <FaLock style={styles.icon} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
            <span onClick={togglePassword} style={styles.eyeIcon}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" style={styles.button}>Login</button>
        </form>
      </div>
    </div>
  );
};

export default Adminlogin;
