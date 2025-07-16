from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from sentence_transformers import SentenceTransformer, util

import requests
import numpy as np
import math


load_dotenv()

app = Flask(__name__)
CORS(app)


# Initialize the Sentence Transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

# MongoDB setup
mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(mongo_uri)
db = client['vistara-news-3']

users_collection = db['user']
saved_articles_collection = db['saved_articles']
logging_collection = db['logging']


@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    firstName = data.get('firstName')
    lastName = data.get('lastName')
    email = data.get('email')
    password = data.get('password')
    country = data.get('country')
    agreeToTerms = data.get('agreeToTerms')


    if not agreeToTerms:
        return jsonify({'message': 'You must agree to the Terms and Conditions.'}), 400

    existing_user = users_collection.find_one({'email': email})
    if existing_user:
        return jsonify({'message': 'User already exists with this email.'}), 400

    hashed_password = generate_password_hash(password)

   

    result = users_collection.insert_one({
  'firstName': firstName,
  'lastName': lastName,
  'email': email,
  'password': hashed_password,
  'country': country,
  'agreeToTerms': agreeToTerms,
  'saved': [],
  'action': []   
})

    new_user = {
        '_id': str(result.inserted_id),
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': hashed_password,
        'country': country,
        'agreeToTerms': agreeToTerms,
        'saved': [],
        'liked': []
    }

    del new_user['password']  # Don't return password
    return jsonify({'message': 'User registered successfully', 'user': new_user}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({'email': email})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid email or password.'}), 400

    user.pop('password', None)
    user.pop('saved',None)
    user.pop('action',None) 
    user['_id'] = str(user['_id'])
    
    return jsonify({'message': 'Login successful', 'user': user}), 200


@app.route('/google-login', methods=['POST'])
def google_login():
    data = request.json
    email = data.get('email')

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'message': 'User not found, please sign up.'}), 404

    user.pop('password', None)   
    user.pop('saved',None)
    user.pop('action',None)       
    user['_id'] = str(user['_id'])  
    return jsonify({'message': 'Login successful', 'user': user}), 200


@app.route('/api/articles/save', methods=['POST'])
def save_article():
    data = request.json
    title = data.get('title')
    newsUrl = data.get('newsUrl')
    category = data.get('category')
    description = data.get('description')
    email = data.get('email')
    print(title, newsUrl, category, description, email)

    if not all([title, newsUrl, category, description, email]):
        return jsonify({'error': 'Title, newsUrl, category, description and email are required'}), 400

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    existing_article = saved_articles_collection.find_one({'newsUrl': newsUrl})
    if existing_article:
        article_id = existing_article['_id']
    else:
        article_result = saved_articles_collection.insert_one({
            'title': title,
            'newsUrl': newsUrl,
            'description': description,
            'category': category
        })
        article_id = article_result.inserted_id

    if article_id in user.get('saved', []):
        return jsonify({'message': 'Article already saved'}), 409

    users_collection.update_one(
        {'email': email},
        {'$push': {'saved': {'$each': [article_id], '$position': 0}}}
    )

    return jsonify({'message': "Article saved successfully"}), 201


@app.route('/api/log-action', methods=['POST'])
def log_action():
    data = request.json
    title = data.get('title')
    newsUrl = data.get('newsUrl')
    description = data.get('description')
    author = data.get('author')
    category = data.get('category')
    email = data.get('email')

    if not all([title, newsUrl, description, category, email]):
        return jsonify({'error': 'Missing fields in action log'}), 400

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    log_result = logging_collection.insert_one({
        'title': title,
        'newsUrl': newsUrl,
        'description': description,
        'author': author,
        'category': category,
         'timestamp':datetime.now(timezone.utc)
    })

    log_id = log_result.inserted_id

    users_collection.update_one(
        {'email': email},
        {'$push': {'action': {'$each': [log_id], '$position': 0}}}
    )

    return jsonify({'message': "Action logged successfully"}), 201


@app.route('/api/userbasic', methods=['GET'])
def user_basic():
    raw_email = request.args.get('email')
    if not raw_email:
        return jsonify({'error': 'Email is required'}), 400

    email = raw_email.strip()
    print(email)

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    basic_info = {
        'firstName': user.get('firstName'),
        'lastName': user.get('lastName'),
        'email': user.get('email'),
        'country': user.get('country')
    }

    return jsonify(basic_info)

@app.route('/api/saved-articles', methods=['GET'])
def get_saved_articles():
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = users_collection.find_one({'email': email})
    if not user or 'saved' not in user:
        return jsonify([])

    saved_ids = user.get('saved', [])
    articles = list(saved_articles_collection.find({'_id': {'$in': saved_ids}}))

    id_to_article = {str(article['_id']): article for article in articles}
    ordered_articles = [id_to_article.get(str(_id)) for _id in saved_ids if str(_id) in id_to_article]
    articles=ordered_articles

    for article in articles:
        article['_id'] = str(article['_id'])  # convert ObjectId to string for JSON

    return jsonify(articles)




@app.route('/api/recommendations-tf', methods=['GET'])
def recommend_articles():
    email = request.args.get('email')
    
    news_api_key = os.getenv('NEWS_API_KEY')
    if not news_api_key:
        raise ValueError("NEWS_API_KEY is required in .env file")
    
    if not email:
        print("email")
        return jsonify({'error': 'Email is required'}), 400
    

    user = users_collection.find_one({'email': email})
    if not user:
        print(2)
        return jsonify({'error': 'User not found'}), 404

    # Fetch logged articles for this user
    logged_ids = user.get('action', [])
    if not logged_ids:
        print(3)
        return jsonify({'message': 'No logged articles found for user'}), 200

    logged_articles = list(logging_collection.find({'_id': {'$in': logged_ids}}))

    if not logged_articles:
        return jsonify({'message': 'No logged articles found in database'}), 200

    # Prepare user log corpus
    user_corpus = [
        article.get('title', '') + " " + article.get('description', '')
        for article in logged_articles
    ]

     # Record logged titles or URLs to exclude later
    logged_titles = set(article.get('title') for article in logged_articles if article.get('title'))

    # Collect timestamps
    timestamps = [article.get('timestamp') for article in logged_articles]

    # Parse timestamps to datetime objects
    now = datetime.now(timezone.utc)
    times = []
    for t in timestamps:
        if isinstance(t, str):
            try:
                dt = datetime.fromisoformat(t)
                # if it’s naive, make it UTC-aware
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                times.append(dt)
            except ValueError:
                # fallback: skip invalid timestamps
                continue
        elif isinstance(t, datetime):
            # if it's already a datetime, make sure it's timezone-aware
            if t.tzinfo is None:
                t = t.replace(tzinfo=timezone.utc)
            times.append(t)

    # Compute time-based weights (exponential decay)
    lambda_factor = 0.05  # control decay rate, tweak this value
    time_weights = np.array([
        math.exp(-lambda_factor * (now - t).total_seconds() / 3600) for t in times
    ])

    # Fetch fresh articles from NewsAPI (top headlines across categories)
    url = f'https://newsapi.org/v2/top-headlines?language=en&pageSize=30&apiKey={news_api_key}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch articles from NewsAPI'}), 500

    fresh_articles = response.json().get('articles', [])
    if not fresh_articles:
        return jsonify({'message': 'No fresh articles found from NewsAPI'}), 200

    fresh_corpus = [
        (article['title'] + " " + article.get('description', ''), article)
        for article in fresh_articles
        if article.get('title') and article.get('description') and article['title'] not in logged_titles
    ]

    if not fresh_corpus:
        return jsonify({'message': 'No valid articles to compare'}), 200

    # Vectorize all text data (user log + fresh)
    tfidf = TfidfVectorizer(stop_words='english')
    combined_texts = user_corpus + [text for text, _ in fresh_corpus]
    tfidf_matrix = tfidf.fit_transform(combined_texts)

    # Compute similarity between each fresh article and user's log corpus
    similarity_scores = cosine_similarity(
        tfidf_matrix[-len(fresh_corpus):], tfidf_matrix[:len(user_corpus)]
    )
    # Apply time-based weights to similarity scores
    weighted_scores = similarity_scores * time_weights

    # Average similarity for each fresh article
    average_similarities = weighted_scores.mean(axis=1)

    # Get top 10 article indices
    top_indices = average_similarities.argsort()[-20:][::-1]

    recommendations = []
    for idx in top_indices:
        article = fresh_corpus[idx][1]
        recommendations.append({
    'title': article['title'],
    'description': article['description'],
    'imageUrl': article['urlToImage'],  
    'newsUrl': article['url'],          
    'author': article.get('author', 'Unknown'),  
    'date': article['publishedAt'],     
    'source': article['source']['name'],
    'category': 'Recommended'           
})

    return jsonify({'recommendations': recommendations}), 200


@app.route('/api/recommendations-lm', methods=['GET'])
def recommend_articles_lm():
    email = request.args.get('email')

    news_api_key = os.getenv('NEWS_API_KEY')
    if not news_api_key:
        raise ValueError("NEWS_API_KEY is required in .env file")
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    logged_ids = user.get('action', [])
    if not logged_ids:
        return jsonify({'message': 'No logged articles found for user'}), 200

    logged_articles = list(logging_collection.find({'_id': {'$in': logged_ids}}))
    if not logged_articles:
        return jsonify({'message': 'No logged articles found in database'}), 200

    user_corpus = [
        article.get('title', '') + " " + article.get('description', '')
        for article in logged_articles
    ]

    logged_titles = set(article.get('title') for article in logged_articles if article.get('title'))

    timestamps = [article.get('timestamp') for article in logged_articles]
    now = datetime.now(timezone.utc)
    times = []
    for t in timestamps:
        if isinstance(t, str):
            try:
                dt = datetime.fromisoformat(t)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                times.append(dt)
            except ValueError:
                continue
        elif isinstance(t, datetime):
            if t.tzinfo is None:
                t = t.replace(tzinfo=timezone.utc)
            times.append(t)

    lambda_factor = 0.05
    time_weights = np.array([
        math.exp(-lambda_factor * (now - t).total_seconds() / 3600) for t in times
    ])

    url = f'https://newsapi.org/v2/top-headlines?language=en&pageSize=30&apiKey={news_api_key}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch articles from NewsAPI'}), 500

    fresh_articles = response.json().get('articles', [])
    if not fresh_articles:
        return jsonify({'message': 'No fresh articles found from NewsAPI'}), 200

    fresh_corpus = [
        (article['title'] + " " + article.get('description', ''), article)
        for article in fresh_articles
        if article.get('title') and article.get('description') and article['title'] not in logged_titles
    ]

    if not fresh_corpus:
        return jsonify({'message': 'No valid articles to compare'}), 200

    # LM Encoding instead of TF-IDF
    try:
        user_embeddings = model.encode(user_corpus, convert_to_tensor=True)
        fresh_texts = [text for text, _ in fresh_corpus]
        fresh_embeddings = model.encode(fresh_texts, convert_to_tensor=True)

        # Cosine similarity
        similarity_scores = util.cos_sim(fresh_embeddings, user_embeddings).cpu().numpy()

        # Apply time-based weights
        weighted_scores = similarity_scores * time_weights

        # Average similarities
        average_similarities = weighted_scores.mean(axis=1)

        # Top 15 indices
        top_indices = average_similarities.argsort()[-20:][::-1]

        recommendations = []
        for idx in top_indices:
            article = fresh_corpus[idx][1]
            recommendations.append({
                'title': article['title'],
                'description': article['description'],
                'imageUrl': article['urlToImage'],
                'newsUrl': article['url'],
                'author': article.get('author', 'Unknown'),
                'date': article['publishedAt'],
                'source': article['source']['name'],
                'category': 'Recommended'
            })

        return jsonify({'recommendations': recommendations}), 200

    except Exception as e:
        return jsonify({'error': f'Error during recommendation: {str(e)}'}), 500




if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Server is running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
