// src/pages/profile/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const ProfilePage = ({ setIsAuthenticated }) => {
  const [selectedSection, setSelectedSection] = useState('basic');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedArticles, setSavedArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const articlesPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    console.log(email);

    if (email) {
      // Fetch user basic info
      fetch(`http://localhost:5000/api/userbasic?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => {
          setUserInfo(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching user info:', err);
          setLoading(false);
        });

      // Fetch saved articles
      fetch(`http://localhost:5000/api/saved-articles?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => {
          setSavedArticles(data);
          setArticlesLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching saved articles:', err);
          setArticlesLoading(false);
        });
    } else {
      setLoading(false);
      setArticlesLoading(false);
    }
  }, []);

  const totalPages = Math.ceil(savedArticles.length / articlesPerPage);
  const startIdx = (currentPage - 1) * articlesPerPage;
  const visibleArticles = savedArticles.slice(startIdx, startIdx + articlesPerPage);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="home-icon" onClick={() => navigate('/')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="white" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span>Home</span>
        </div>
        <div
          className={`nav-item ${selectedSection === 'basic' ? 'active' : ''}`}
          onClick={() => setSelectedSection('basic')}
        >
          Basic Info
        </div>
        <div
          className={`nav-item ${selectedSection === 'saved' ? 'active' : ''}`}
          onClick={() => setSelectedSection('saved')}
        >
          Saved Articles
        </div>
      </aside>

      {/* Logout Button */}
      <div className="logout-button" onClick={handleLogout}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fff" viewBox="0 0 24 24">
          <path d="M16 13v-2H7V8l-5 4 5 4v-3h9zm3-11H5c-1.1 0-2 .9-2 2v6h2V4h14v16H5v-6H3v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <span>Logout</span>
      </div>

      <main className="content">
        {selectedSection === 'basic' ? (
          <div className="basic-info">
            <h2>User Profile</h2>
            {loading ? (
              <p>Loading...</p>
            ) : userInfo ? (
              <>
                <div className="info-box">
                  <label>First Name</label>
                  <div className="info-value">{userInfo.firstName}</div>
                </div>
                <div className="info-box">
                  <label>Last Name</label>
                  <div className="info-value">{userInfo.lastName}</div>
                </div>
                <div className="info-box">
                  <label>Email</label>
                  <div className="info-value">{userInfo.email}</div>
                </div>
                <div className="info-box">
                  <label>Country</label>
                  <div className="info-value">{userInfo.country}</div>
                </div>
              </>
            ) : (
              <p>User info not found.</p>
            )}
          </div>
        ) : (
          <div className="saved-articles">
            <h2>Saved Articles</h2>
            {articlesLoading ? (
              <p>Loading saved articles...</p>
            ) : savedArticles.length === 0 ? (
              <p>No saved articles found.</p>
            ) : (
              <>
                <ul className={`articles-list ${visibleArticles.length < 10 ? 'compact' : ''}`}>
                  {visibleArticles.map((article, index) => (
                    <li key={index}>
                      <a href={article.newsUrl} target="_blank" rel="noopener noreferrer">
                        {article.title}
                      </a>
                    </li>
                  ))}
                </ul>
                {savedArticles.length > articlesPerPage && (
                  <div className="pagination-controls">
                    <button onClick={handlePrev} disabled={currentPage === 1}>
                      ◀ Prev
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={handleNext} disabled={currentPage === totalPages}>
                      Next ▶
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
