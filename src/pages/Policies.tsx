import { useParams } from 'react-router-dom';
import { Shield, FileText, Truck, RefreshCw } from 'lucide-react';

export default function Policies() {
  const { type } = useParams();

  const getPolicyContent = () => {
    switch (type) {
      case 'terms':
        return {
          title: 'Terms & Conditions',
          icon: <FileText className="w-8 h-8 text-indigo-600" />,
          content: `Welcome to Fancy Bazaar. These Terms & Conditions govern your use of our website and the purchase of products from our store. By accessing or using our website, you agree to be bound by these terms.

1. **Facilitator Role & Product Liability Disclaimer**: Fancy Bazaar operates strictly as a dropshipping platform. We facilitate transactions between you and third-party suppliers. We do not manufacture, store, or inspect the products. Consequently, Fancy Bazaar DISCLAIMS ALL LIABILITY for any damages, health issues, allergic reactions, or injuries resulting from the use of any product purchased through our platform. All products are provided "AS IS" without any warranties from Fancy Bazaar.
2. **Order Acceptance & Refusal**: We reserve the right to refuse or cancel any order at any time for any reason, including but not limited to: product unavailability, errors in product or pricing information, or suspected fraud. Your receipt of an order confirmation does not signify our acceptance of your order.
3. **Accuracy of Information**: We do not warrant that product descriptions, pricing, images, or other content on this site are accurate, complete, or current. Colors and textures may vary from what is seen on your screen.
4. **Third-Party Content**: Our site may contain links to third-party websites or services that are not owned or controlled by Fancy Bazaar. We assume no responsibility for the content or practices of any third-party sites.
5. **Indemnification**: You agree to indemnify, defend, and hold harmless Fancy Bazaar and its owners from any claims, liabilities, damages, and expenses (including legal fees) arising from your use of the site or your violation of these Terms.
6. **Limitation of Liability**: IN NO EVENT SHALL FANCY BAZAAR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR IN CONNECTION WITH THE PRODUCTS OR SERVICES. OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SPECIFIC PRODUCT GIVING RISE TO THE CLAIM.
7. **Governing Law**: These terms are governed by the laws of India. Any legal action shall be brought exclusively in the courts of our choosing in India.`
        };
      case 'privacy':
        return {
          title: 'Privacy Policy',
          icon: <Shield className="w-8 h-8 text-indigo-600" />,
          content: `Your privacy is a top priority. This policy outlines how your data is handled.

1. **Collection of Information**: We collect personal details (name, phone, address, email) only as necessary to process your transactions and improve your experience.
2. **Mandatory Third-Party Sharing for Fulfillment**: To fulfill your order, we MUST share your personal delivery details with third-party suppliers and logistics providers (who may be located outside your immediate region). This sharing is a legal necessity for the performance of the contract between you and Fancy Bazaar. By placing an order, you provide irrevocable consent for this data transfer.
3. **Data Retention**: We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including legal, accounting, or reporting requirements.
4. **Payment Security**: We do not store or process your sensitive bank/card details. Payments are handled via secure third-party gateways or verified through UTR numbers you provide.
5. **Cookies**: We use cookies to enhance site functionality and analyze traffic. You can manage cookie preferences through your browser settings.`
        };
      case 'shipping':
        return {
          title: 'Shipping & Delivery Policy',
          icon: <Truck className="w-8 h-8 text-indigo-600" />,
          content: `Please review our shipping terms before purchasing.

1. **Estimated Timelines**: Orders are typically processed within 48-72 hours. Standard shipping takes 5-10 business days. ALL TIMELINES ARE ESTIMATES and not binding guarantees.
2. **Risk of Loss**: All items purchased from Fancy Bazaar are made pursuant to a shipment contract. This means that the RISK OF LOSS AND TITLE for such items pass to you upon our delivery of the item to the carrier. We are not responsible for items lost or stolen after they have been marked as "Delivered" by the courier.
3. **Address Accuracy**: It is the customer's sole responsibility to provide a complete and accurate shipping address. Fancy Bazaar is not liable for orders delivered to the wrong address or returned due to customer error. Reshipping fees will apply.
4. **Shipping Delays**: We are not responsible for delays caused by the courier service, customs, extreme weather, or other "Force Majeure" events beyond our control.`
        };
      case 'refund':
        return {
          title: 'Cancellation & Refund Policy',
          icon: <RefreshCw className="w-8 h-8 text-indigo-600" />,
          content: `Our return and refund policy is strict to ensure business sustainability.

1. **No "Change of Mind" Returns**: We do NOT accept returns or offer refunds if you simply change your mind, find a better price elsewhere, or decided you don't like the product after receiving it.
2. **Damaged or Incorrect Items**: Returns are ONLY accepted if the item is received in a damaged state or is completely different from what was ordered.
3. **Strict 3-Day Deadline**: You MUST report any damage or discrepancy within 3 days (72 hours) of delivery. Claims made after this period will be summarily rejected. You must provide an unboxing video as evidence.
4. **Cancellations**: Cancellation requests are only valid within 12 hours of order placement. Once an order is sent to our supplier for fulfillment, it CANNOT be cancelled or modified.
5. **Refund Method**: Approved refunds are issued to the original payment method or via UPI. Refunds may take 7-14 business days to reflect in your account.
6. **Non-Returnable Categories**: For hygiene and safety, products in categories like Beauty, Healthcare, Innerwear, and customized items are strictly non-returnable under any circumstances.`
        };
      default:
        return { title: 'Policy Not Found', icon: null, content: '' };
    }
  };

  const policy = getPolicyContent();

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl mb-4 transition-colors">
            {policy.icon}
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white transition-colors">{policy.title}</h1>
        </div>
        <div className="prose prose-indigo dark:prose-invert max-w-none">
          <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-6 whitespace-pre-line transition-colors">
            {policy.content}
          </div>
        </div>
      </div>
    </div>
  );
}
