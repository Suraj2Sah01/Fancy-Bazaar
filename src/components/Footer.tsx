import { Link } from 'react-router-dom';
import { MessageCircle, Truck, ShieldCheck, HelpCircle, Package } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => setSettings(data.general));
  }, []);

  const whatsappLink = `https://wa.me/${settings?.whatsappSupportNumber || '918870472700'}?text=Hello, I need help with my order. Please assist me.`;

  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              Customer Support
            </h3>
            <ul className="space-y-3">
              <li>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Support
                </a>
              </li>
              <li>
                <Link to="/my-orders" className="hover:text-white transition-colors flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Track My Order
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Contact: {settings?.supportNumber || '8870472700'}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Policies
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/policy/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/policy/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/policy/shipping" className="hover:text-white transition-colors">Shipping & Delivery Policy</Link></li>
              <li><Link to="/policy/refund" className="hover:text-white transition-colors">Cancellation & Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Secure Payments
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              All transactions are secured and encrypted. 100% Secure UPI Payments (COD Coming Soon).
            </p>
            <Link to="/secure-payments" className="text-xs text-gray-500 hover:text-gray-300">
              Secure Payments
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
          <p>© 2026 Fancy Bazaar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
