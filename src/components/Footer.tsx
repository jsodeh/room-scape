
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="text-xl font-semibold text-primary">RoomScapR</Link>
            <p className="mt-4 text-sm text-gray-600">
              Transform empty spaces into beautifully staged properties with our cutting-edge AI technology.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Product</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors">Features</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors">Pricing</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors">Gallery</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors">Testimonials</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors">About</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors">Blog</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors">Careers</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors">Contact</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-primary transition-colors">Cookie Policy</Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            &copy; {currentYear} RoomScapR. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
