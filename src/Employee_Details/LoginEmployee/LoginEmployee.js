// File: LoginEmployee.js

import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import { useNavigate } from 'react-router-dom';
import './LoginEmployee.css';
import companylogo from '../Image/companylogo.png'; 

const LoginEmployee = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      let matched = false;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email === email && data.password === password) {
          matched = true;
          setLoginSuccess(true);
          setLoginStatus(`Login Successful! Badge ID: ${data.badgeId}`);
          localStorage.setItem('email', data.email);
          localStorage.setItem('badgeId', data.badgeId);
          setTimeout(() => {
            navigate('/employee');
          }, 1000);
        }
      });

      if (!matched) {
        setLoginSuccess(false);
        setLoginStatus('Invalid Email or Password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginSuccess(false);
      setLoginStatus('Error occurred during login');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        {/* Image Row */}
        <div className="login-header">
          <img src={companylogo} alt="User" className="login-image" />
          <h3>Employee Login</h3>
        </div>

        <div className="input-group">
          <FaEnvelope className="input-icon" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <FaLock className="input-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="eye-icon" onClick={togglePasswordVisibility}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button type="submit" className="login-btn">Login</button>

        {loginStatus && (
          <p className={`login-status ${loginSuccess ? 'success' : 'error'}`}>
            {loginStatus}
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginEmployee;
