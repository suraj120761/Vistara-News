import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-light border-top mt-5">
      <div className="container py-5">
        <div className="row">
          {/* Brand */}
          <div className="col-md-3 mb-4">
            <h5 className="text-dark">News Vista</h5>
            <p className="text-muted">
              Your trusted source for the latest news and updates from around the world.
            </p>
          </div>

          {/* Categories */}
          <div className="col-md-3 mb-4">
            <h6 className="text-uppercase text-dark">Categories</h6>
            <ul className="list-unstyled">
              {["Business", "Technology", "Entertainment", "Sports", "Health", "Science"].map((category) => (
                <li key={category}>
                  <Link to={`/categories/${category.toLowerCase()}`} className="text-muted text-decoration-none d-block py-1">
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="col-md-3 mb-4">
            <h6 className="text-uppercase text-dark">Company</h6>
            <ul className="list-unstyled">
              {["About", "Careers", "Press", "Contact", "Terms", "Privacy"].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="text-muted text-decoration-none d-block py-1">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subscribe */}
          <div className="col-md-3 mb-4">
            <h6 className="text-uppercase text-dark">Subscribe</h6>
            <p className="text-muted">Get the latest news delivered to your inbox.</p>
            <form>
              <div className="mb-2">
                <input type="email" className="form-control" placeholder="Your email" required />
              </div>
              <button type="submit" className="btn btn-primary w-100">Subscribe</button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-top pt-4 mt-4 d-flex flex-column flex-md-row justify-content-between align-items-center">
          <p className="mb-2 mb-md-0 text-muted">© {new Date().getFullYear()} NewsHub. All rights reserved.</p>
          <div className="d-flex gap-3">
            <a href="#" className="text-muted" aria-label="Facebook">
              <i className="bi bi-facebook fs-5"></i>
            </a>
            <a href="#" className="text-muted" aria-label="Twitter">
              <i className="bi bi-twitter fs-5"></i>
            </a>
            <a href="#" className="text-muted" aria-label="Instagram">
              <i className="bi bi-instagram fs-5"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
