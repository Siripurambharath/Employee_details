import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import './login.css'
import {
  auth,
  googleProvider as provider, // ✅ fixed import
  db,
} from '../Firebase/Firebase';

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';

import companylogo from '../Image/companylogo.png';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import Swal from 'sweetalert2';
import { FcGoogle } from 'react-icons/fc';

function Login() {
  
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const { email, password } = formData;

    if (email === 'admin@gmail.com' && password === 'admin@123') {
      Swal.fire({
        icon: 'success',
        title: 'Admin login successful!',
        confirmButtonText: 'OK',
      }).then(() => {
        navigate('/dashboard');
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      Swal.fire({
        icon: 'success',
        title: 'Login successful!',
        confirmButtonText: 'OK',
      }).then(() => {
        navigate('/dashboard');
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Credentials',
        text: 'Please try again...',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleGoogleLogin = async () => {
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const generatedPassword = `${user.displayName.replace(/\s+/g, '')}@123`;

      const userDocRef = doc(db, 'customers', user.uid);
      let userDoc = await getDoc(userDocRef);

      try {
        const credential = EmailAuthProvider.credential(
          user.email,
          generatedPassword
        );
        await linkWithCredential(user, credential);
      } catch (linkError) {
        if (linkError.code !== 'auth/credential-already-in-use') {
          console.error('Linking failed:', linkError);
        }
      }

      let isNewUser = false;
      if (!userDoc.exists()) {
        isNewUser = true;
        await setDoc(userDocRef, {
          uid: user.uid,
          fullName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          password: generatedPassword,
          createdAt: new Date(),
        });

        const dashboardRef = doc(db, 'dashboard', 'customers');
        const dashboardSnap = await getDoc(dashboardRef);

        if (dashboardSnap.exists()) {
          await updateDoc(dashboardRef, {
            count: increment(1),
          });
        } else {
          await setDoc(dashboardRef, {
            count: 1,
          });
        }

        try {
       await fetch('http://localhost:5000/api/send-welcome-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: user.email,
    fullName: user.displayName,
    password: generatedPassword,
  }),
});

        } catch (err) {
          console.error('Welcome email error:', err);
        }

        userDoc = await getDoc(userDocRef);
      }

      if (userDoc.exists()) {
        const userData = { uid: user.uid, ...userDoc.data() };
        localStorage.setItem('customer', JSON.stringify(userData));
      }

      Swal.fire({
        icon: 'success',
        title: isNewUser
          ? 'Account created with Google!'
          : 'Login successful with Google!',
        confirmButtonText: 'OK',
      }).then(() => {
        navigate('/dashboard');
        window.location.reload();
      });
    } catch (error) {
      console.error('Google Login Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Google Sign-In Failed',
        text: error.message,
        confirmButtonText: 'OK',
      });
    }
  };

  return (
    <div className="customer-login-page">
      <form onSubmit={handleSubmit} className="customer-login-form-wrapper">
        <div className="customer-login-box">
          <div className="customer-login-container">
            <div className="customer-login-header">
              <img
                src={companylogo}
                alt="Logo"
                className="customer-login-logo"
              />
              <h2 className="customer-login-title">Login</h2>
            </div>

            <div className="customer-login-field">
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Username"
                required
                className="customer-login-input"
              />
              <i className="customer-login-icon bx bx-user"></i>
            </div>

            <div className="customer-login-field">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="customer-login-input"
              />
              <i className="customer-login-icon bx bx-lock-alt"></i>
              <span
                className="customer-toggle-password-icon"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
              </span>
            </div>

            <button type="submit" className="customer-login-submit">
              Login
            </button>

            <div className="mb-3"></div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="customer-google-button"
            >
              <FcGoogle style={{ marginRight: '8px' }} size={24} />
              Login with Google
            </button>

            <div className="customer-login-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/signup" className="customer-login-link">
                  Sign up
                </Link>{' '}
                |{' '}
                <Link to="/forgot-password" className="customer-login-link">
                  Forgot Password?
                </Link>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Login;
