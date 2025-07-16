import React, { Component } from 'react';
import NewsItem from '../../components/NewsItem';
import Spinner from '../../components/Spinner';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate } from "react-router-dom";

export function withNavigation(Component) {
  return function WrappedComponent(props) {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  };
}


export class News extends Component {
  static defaultProps = {
    country: 'us',
    pageSize: 6,
    category: 'general',
  };

  static propTypes = {
    country: PropTypes.string,
    pageSize: PropTypes.number,
    category: PropTypes.string,
    searchQuery: PropTypes.string,
  };

  capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  constructor(props) {
    super(props);
    this.state = {
      articles: [],
      loading: true,
      page: 1,
      totalResults: 0,
    };
    document.title = `${this.capitalizeFirstLetter(this.props.category)} - News Vista`;
  }

  async componentDidMount() {
    this.updateNews();
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.category !== this.props.category) {
      this.setState({ page: 1, articles: [], loading: true }, this.updateNews);
    }
  }

  updateNews = async () => {
    const { country, category, pageSize } = this.props;
    const { page } = this.state;
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;

    this.props.setProgress(10);
    const url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&apiKey=${apiKey}&page=${page}&pageSize=${pageSize}`;

    this.setState({ loading: true });

    try {
      let response = await fetch(url);
      let parsedData = await response.json();

      this.setState({
        articles: parsedData.articles || [],
        totalResults: parsedData.totalResults || 0,
        loading: false,
      });

    } catch (error) {
      console.error("Failed to fetch news:", error);
      this.setState({ loading: false });
    }

    this.props.setProgress(100);
  };

  fetchMoreData = async () => {
    const { country, category, pageSize } = this.props;
    const nextPage = this.state.page + 1;
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;

    const url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&apiKey=${apiKey}&page=${nextPage}&pageSize=${pageSize}`;

    try {
      let response = await fetch(url);
      let parsedData = await response.json();

      this.setState({
        articles: this.state.articles.concat(parsedData.articles || []),
        totalResults: parsedData.totalResults || 0,
        page: nextPage,
      });

    } catch (error) {
      console.error("Failed to fetch more news:", error);
    }
  };


  handleSaveArticle = async (article) => {
    const email = localStorage.getItem("userEmail");
    

    if (!localStorage.getItem("userEmail")) {
      this.props.navigate("/login", { replace: true });
      return null;
    }

  const articleWithEmail = {
    ...article,
    email, // add email to the payload
  };

    try {
      const response = await fetch("http://localhost:5000/api/articles/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articleWithEmail),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Article saved successfully!");
      } else {
        alert("Failed to save article: " + data.error);
      }
    } catch (error) {
      console.error("Error saving article:", error);
      alert("An error occurred while saving the article.");
    }

    try {
      const response = await fetch("http://localhost:5000/api/log-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articleWithEmail),
      });

      const data = await response.json();

      
    } catch (error) {
      console.error("Error logging article:", error);
    }


  };

  handleReadMore = async (article) => {
    const email = localStorage.getItem("userEmail");
    

    if (!localStorage.getItem("userEmail")) {
      return null;
    }

  const articleWithEmail = {
    ...article,
    email, // add email to the payload
  };


    try {
      const response = await fetch("http://localhost:5000/api/log-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articleWithEmail),
      });

      const data = await response.json();

      
    } catch (error) {
      console.error("Error logging article:", error);
    }


  };



  render() {
    return (
      <>
        <h1 className="text-center my-3">
          News Vista - Specialized News from {this.capitalizeFirstLetter(this.props.category)}
        </h1>

        {this.state.loading && <Spinner />}

        <InfiniteScroll
          dataLength={this.state.articles.length}
          next={this.fetchMoreData}
          hasMore={this.state.articles.length < this.state.totalResults}
          
        >
          <div className="container">
            <div className="row">
              {this.state.articles.map((element, index) => (
                <div className="col-md-4" key={element.url || index}>
                  <NewsItem
  title={element.title || "No Title"}
  description={element.description || "No Description"}
  imageUrl={element.urlToImage}
  newsUrl={element.url}
  author={element.author}
  date={element.publishedAt}
  source={element.source.name}
  category={this.props.category} // add this
  onSave={this.handleSaveArticle}
  onReadMore={this.handleReadMore}
/>

                </div>
              ))}
            </div>
          </div>
        </InfiniteScroll>
      </>
    );
  }
}


export default withNavigation(News);
