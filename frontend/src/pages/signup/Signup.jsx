import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate here
import axios from 'axios';  
import './Signup.css';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    agreeToTerms: false,
  });

  const [isValidEmail, setIsValidEmail] = useState(true);
  const [passwordMatch, setPasswordMatch] = useState(true);

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  // Initialize useNavigate here inside the function component
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });

      if (name === 'email') {
        setIsValidEmail(emailRegex.test(value));
      }

      if (name === 'confirmPassword') {
        setPasswordMatch(formData.password === value);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isValidEmail && passwordMatch && formData.agreeToTerms) {
      try {
        console.log(formData)
        const response = await axios.post('http://localhost:5000/signup', formData);
        console.log(response.data); // handle success response
        
        // Redirect to login page after successful signup
        navigate('/'); // Assuming '/' is the login route
      } catch (error) {
        console.error('Error during signup:', error); // handle error response
      }
    } else {
      console.log('Invalid Input');
    }
  };

  return (
    <div className="signup-container">
      <a href="/" className="back-to-home">← Back to Home</a>
      <div className="signup-box">
        <div className="signup-box__upper">
          <h2>Create an Account</h2>
          <p>Join Vistara News! for personalised Experience</p>
        </div>
        <div className="signup-box__middle">
          <form onSubmit={handleSubmit}>
            <div className="name-fields">
              <div className="input-field">
                <label>First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="input-field">
                <label>Last Name</label>
                <input 
                  type="text" 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="input-field">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                className={!isValidEmail ? 'invalid' : ''} 
                required 
              />
              {!isValidEmail && <p className="error-text">Please enter a valid email.</p>}
            </div>

            <div className="input-field">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="input-field">
              <label>Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                className={!passwordMatch ? 'invalid' : ''} 
                required 
              />
              {!passwordMatch && <p className="error-text">Passwords do not match.</p>}
            </div>

            <div className="input-field">
              <label>Country</label>
              <select 
                name="country" 
                value={formData.country} 
                onChange={handleChange} 
                required
              >
                <option value="">Select Country</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="IN">India</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
              </select>
            </div>

            <div className="checkbox-field">
              <input 
                type="checkbox" 
                name="agreeToTerms" 
                checked={formData.agreeToTerms} 
                onChange={handleChange} 
                required 
              />
              <label>I agree to the <a href="#">Terms and Conditions</a></label>
            </div>

            <button type="submit" className="signup-btn">Sign Up</button>
          </form>

          
        </div>

        <div className="signup-box__lower">
          <p>Already have an account? <Link to="/" className="login-link">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
