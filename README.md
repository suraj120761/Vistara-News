# 📰 News Vista

**News Vista** is a personalized news website that delivers category-based articles and smart recommendations. Users can read, save, and get suggestions based on their preferences.

---

## ✨ Features

- 🧭 Browse news by category (Science, Health, Technology, etc.)
- 🔐 User authentication (Sign up & Log in)
- 💾 Save favorite articles
- 🎯 Personalized recommendations

---

## 🧠 Recommendation Algorithms

- **TF-IDF + Cosine Similarity**  
  Suggests articles based on keyword relevance from titles and descriptions.

- **MiniLM Embeddings + Cosine Similarity**  
  Uses `all-MiniLM-L6-v2` model for semantic similarity, finding articles with similar meaning.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite)
- **Backend**: Python (Flask)
- **Database**: MongoDB
- **ML/NLP**: scikit-learn, HuggingFace Transformers

---

## 📁 Project Structure

- `src/components/`: Navbar, NewsItem, Spinner, etc.
- `src/pages/`: Login, Signup, News, Profile, Recommendations
- Backend Flask server handles API calls
- MongoDB stores users, saved articles, and action logs

---

## 📜 License

MIT License © 2025 Pinnenti Santosh Babu
