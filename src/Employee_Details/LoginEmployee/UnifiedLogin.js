import React, { useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../Firebase/Firebase';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import companylogo from '../Image/companylogo.png';
import './UnifiedLogin.css';

const UnifiedLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.uid) {
        await checkUserInFirestore(user);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await handleSocialLogin(result.user);
        }
      } catch (error) {
        handleAuthError(error);
      }
    };
    initAuth();
  }, []);

  const togglePassword = () => setShowPassword(prev => !prev);

  const handleAuthError = useCallback((error) => {
    const errorMessages = {
      'auth/user-not-found': '❌ No account found with this email',
      'auth/wrong-password': '❌ Incorrect password',
      'auth/invalid-email': '❌ Invalid email format',
      'auth/too-many-requests': '❌ Too many attempts. Try again later.',
      'auth/account-exists-with-different-credential': '❌ Account exists with different login method',
      'auth/popup-blocked': '❌ Popup blocked. Please allow popups',
      'auth/popup-closed-by-user': '❌ Login cancelled',
      'auth/network-request-failed': '❌ Network error. Check connection',
      'auth/requires-recent-login': '❌ Session expired. Please login again',
    };
    setStatusMsg(errorMessages[error?.code] || `❌ Login failed: ${error?.message}`);
    setSuccess(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg('');

    const enteredEmail = email.trim().toLowerCase();

    if (enteredEmail === 'admin@gmail.com' && password === 'admin@123') {
      localStorage.setItem('email', enteredEmail);
      localStorage.setItem('uid', 'admin');
      setSuccess(true);
      setStatusMsg('✅ Admin Login Successful!');
      setTimeout(() => navigate('/dashboard'), 500);
      setIsLoading(false);
      return;
    }

    if (!enteredEmail || !password) {
      setStatusMsg('❌ Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, enteredEmail, password);
      await checkUserInFirestore(userCredential.user);
    } catch (error) {
      console.error('Login error:', error);

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, enteredEmail);
          if (methods.includes('google.com')) {
            setStatusMsg('❌ This email is registered with Google. Use Google Sign-In.');
          } else {
            handleAuthError(error);
          }
        } catch (innerError) {
          handleAuthError(innerError);
        }
      } else {
        handleAuthError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatusMsg('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        await handleSocialLogin(result.user);
      }
    } catch (error) {
      if (['auth/popup-blocked', 'auth/popup-closed-by-user'].includes(error.code)) {
        await signInWithRedirect(auth, provider);
      } else {
        handleAuthError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (user) => {
    if (!user?.uid) return;

    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', user.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0];
        const existingUser = existingDoc.data();
        const updatedData = {
          providers: Array.from(new Set([...(existingUser.providers || []), ...user.providerData.map(p => p.providerId)])),
        };

        await setDoc(doc(db, 'users', existingDoc.id), updatedData, { merge: true });
        localStorage.setItem('uid', user.uid);
        localStorage.setItem('originalUid', existingDoc.id);
        localStorage.setItem('email', user.email || '');
        localStorage.setItem('badgeId', existingUser.badgeId || '');
      } else {
        await createNewUserRecord(user);
      }
    }

    await completeLogin(user);
  };

  const checkUserInFirestore = async (user) => {
    if (!user?.uid) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        await completeLogin(user);
      } else {
        await createNewUserRecord(user);
        await completeLogin(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setStatusMsg('❌ Error verifying account');
      await signOut(auth);
    }
  };

  const completeLogin = async (user) => {
    try {
      localStorage.setItem('uid', user.uid);
      localStorage.setItem('email', user.email || '');

      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        localStorage.setItem('badgeId', data.badgeId || '');
      }

      setSuccess(true);
      setStatusMsg('✅ Login Successful!');
      setTimeout(() => navigate('/employee'), 500);
    } catch (error) {
      console.error('Login error:', error);
      setStatusMsg('❌ Error during login');
      await signOut(auth);
      localStorage.clear();
    }
  };

  const createNewUserRecord = async (user) => {
    const userData = {
      uid: user.uid,
      email: user.email || '',
      firstName: user.displayName?.split(' ')[0] || '',
      lastName: user.displayName?.split(' ')[1] || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      providers: user.providerData.map(p => p.providerId),
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.uid), userData);
  };

  return (
    <div className="ul-container">
      <form className="ul-form" onSubmit={handleLogin}>
        <div className="ul-header">
          <img src={companylogo} alt="Company Logo" className="ul-logo" />
        </div>
        <div className="ul-input-group">
          <FaEnvelope className="ul-icon" />
          <input
            type="email"
            placeholder="Email"
            className="ul-input"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="ul-input-group">
          <FaLock className="ul-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            className="ul-input"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="ul-eye-icon" onClick={togglePassword}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <button type="submit" className="ul-button" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        <div
          className="ul-google-login"
          onClick={!isLoading ? handleGoogleLogin : undefined}
          style={isLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
        >
          <FcGoogle className="ul-google-icon" />
          <span>Sign in with Google</span>
        </div>
        {statusMsg && (
          <p className={`ul-status ${success ? 'ul-success' : 'ul-error'}`}>
            {statusMsg}
          </p>
        )}
      </form>
    </div>
  );
};

export default UnifiedLogin;
