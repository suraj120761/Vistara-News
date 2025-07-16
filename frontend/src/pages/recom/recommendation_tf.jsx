import React, { useEffect, useState } from "react";
import NewsItem from "../../components/NewsItem";
import Spinner from "../../components/Spinner";
import { useNavigate } from "react-router-dom";

const Recommendationstf = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // check localStorage
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:5000/api/recommendations-tf?email=${userEmail}`
        );
        const data = await response.json();
        setArticles(data.recommendations);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
      setLoading(false);
    };

    fetchRecommendations();
  }, [userEmail, navigate]);

  const handleReadMore = async (article) => {
    await fetch("http://localhost:5000/api/log-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        action: "read_more",
        ...article,
      }),
    });
  };

  const handleSave = async (article) => {
    try {
      // Save article to saved_articles collection
      const saveResponse = await fetch("http://localhost:5000/api/articles/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          ...article,
        }),
      });
  
      const saveData = await saveResponse.json();
  
      if (saveResponse.ok) {
        alert("Article saved successfully!");
      } else {
        alert("Failed to save article: " + saveData.error);
      }
  
      // Log the 'save' action
      await fetch("http://localhost:5000/api/log-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          action: "save",
          ...article,
        }),
      });
    } catch (error) {
      console.error("Error saving or logging article:", error);
      alert("An error occurred while saving the article.");
    }
  };
  

  return (
    <div className="container my-3">
      <h2 className="text-center">📝 Recommended Articles Using TF-IDF</h2>
      {loading ? (
        <Spinner />
      ) : (
        <div className="row">
          {articles.map((article, index) => (
            <div className="col-md-4" key={index}>
              <NewsItem
                title={article.title}
                description={article.description}
                imageUrl={article.imageUrl}
                newsUrl={article.newsUrl}
                author={article.author}
                date={article.date}
                source={article.source}
                category={article.category}
                onReadMore={handleReadMore}
                onSave={handleSave}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendationstf;
