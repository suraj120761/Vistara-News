import React, { Component } from 'react';

export class NewsItem extends Component {

  handleReadMore = () => {
    const { title, description, imageUrl, newsUrl, author, date, source, onReadMore } = this.props;
    
    // Call onReadMore if it exists
    if (onReadMore) {
      onReadMore({
        title,
        description,
        imageUrl,
        newsUrl,
        author,
        date,
        source,
        category: this.props.category,
      });
    }

    // Open article in new tab
    window.open(newsUrl, '_blank', 'noopener,noreferrer');
  };

  render() {
    let { title, description, imageUrl, newsUrl, author, date, source, onSave } = this.props;

    return (
      <div className='my-3'>
        <div className="card">
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            position: 'absolute',
            top: '0',
            right: '0',
          }}>
            <span className="badge rounded-pill bg-danger">{source}</span>
          </div>
          <img
            src={!imageUrl ? "https://cdn2.vectorstock.com/i/1000x1000/81/56/empty-icon-on-white-background-simple-element-vector-28228156.jpg" : imageUrl}
            className="card-img-top"
            alt="news"
          />
          <div className="card-body">
            <h5 className="card-title">{title}...</h5>
            <p className="card-text">{description}...</p>
            <p className="card-text">
              <small className="text-muted">
                By {!author ? "Unknown" : author} on {new Date(date).toDateString()}
              </small>
            </p>
            <button className="btn btn-sm btn-dark" onClick={this.handleReadMore}>
              Read More
            </button>
            <button
              className="btn btn-sm btn-success mx-2"
              onClick={() =>
                onSave &&
                onSave({
                  title,
                  description,
                  imageUrl,
                  newsUrl,
                  author,
                  date,
                  source,
                  category: this.props.category, // pass category to onSave
                })
              }
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default NewsItem;
