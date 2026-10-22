import { pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(),
  name: text('name'),
  mobile: text('mobile').unique(),
  passwordHash: text('password_hash'),
  email: text('email'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  status: text('status').default('active'),
  avatar: text('avatar'),
  address: jsonb('address'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  originalPrice: numeric('original_price', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: numeric('selling_price', { precision: 10, scale: 2 }).notNull(),
  supplierCost: numeric('supplier_cost', { precision: 10, scale: 2 }),
  businessMargin: numeric('business_margin', { precision: 10, scale: 2 }),
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).default('0'),
  discountType: text('discount_type').default('fixed'), // 'fixed' or 'percentage'
  shippingCharges: numeric('shipping_charges', { precision: 10, scale: 2 }).default('0'),
  additionalCharges: numeric('additional_charges', { precision: 10, scale: 2 }).default('0'),
  category: text('category').default('General'),
  averageRating: numeric('average_rating', { precision: 2, scale: 1 }).default('4.5'),
  availability: boolean('availability').default(true),
  isPublished: boolean('is_published').default(true),
  imageUrl: text('image_url'),
  images: jsonb('images').default([]), // Array of strings: ["url1", "url2"]
  sourceUrl: text('source_url'),
  colors: jsonb('colors').default([]), // Array of strings: ["Red", "Blue"]
  stock: integer('stock').default(5),
  platformFee: numeric('platform_fee', { precision: 10, scale: 2 }).default('0'),
  sizes: jsonb('sizes').default([]), // Array of strings: ["S", "M", "L"]
  badge: text('badge'), // 'Trending', 'Bestseller', 'Fancy Choice', 'Recommended'
  specifications: jsonb('specifications').default({}),
  isReturnable: boolean('is_returnable').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  title: text('title'),
  destinationUrl: text('destination_url'),
  isEnabled: boolean('is_enabled').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerMobile: text('customer_mobile').notNull(),
  address: jsonb('address').notNull(), // {house, street, city, state, pincode, landmark}
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  productSnapshot: jsonb('product_snapshot').notNull(), // Snapshot of pricing at time of order
  selectedColor: text('selected_color'),
  selectedSize: text('selected_size'),
  quantity: integer('quantity').default(1),
  finalAmount: numeric('final_amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(), // 'COD' or 'UPI'
  paymentStatus: text('payment_status').default('Pending'), // 'Pending', 'Verification Pending', 'Verified', 'Failed'
  orderStatus: text('order_status').default('Order Placed'),
  fcmToken: text('fcm_token'),
  cancellationReason: text('cancellation_reason'),
  utrReference: text('utr_reference'),
  deliveryOtp: text('delivery_otp'),
  deliveryReason: text('delivery_reason'),
  deliveryVerifiedWithOtp: boolean('delivery_verified_with_otp').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull(),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by'), // UID of admin
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
});

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  discountType: text('discount_type').default('fixed'), // 'fixed' or 'percentage'
  minPurchase: numeric('min_purchase', { precision: 10, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  targetAudience: text('target_audience').default('all'), // 'all' or 'vip'
  createdAt: timestamp('created_at').defaultNow(),
});

export const wishlists = pgTable('wishlists', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orderChangeRequests = pgTable('order_change_requests', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'cancel', 'address', 'mobile'
  requestedValue: jsonb('requested_value'), // New address or mobile number
  status: text('status').default('pending'), // 'pending', 'approved', 'rejected'
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const adminLoginAttempts = pgTable('admin_login_attempts', {
  id: serial('id').primaryKey(),
  ip: text('ip').notNull(),
  attemptedAt: timestamp('attempted_at').defaultNow(),
  isSuccess: boolean('is_success').default(false),
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  subscriptionId: text('subscription_id').notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerMobile: text('customer_mobile').notNull(),
  customerEmail: text('customer_email'),
  userId: text('user_id'),
  amount: numeric('amount', { precision: 10, scale: 2 }).default('299.00').notNull(),
  paymentMethod: text('payment_method').default('UPI').notNull(),
  utrNumber: text('utr_number').notNull().unique(),
  status: text('status').default('Pending Verification').notNull(), // 'Pending Verification', 'Verified', 'Rejected'
  adminNotes: text('admin_notes'),
  verifiedBy: text('verified_by'),
  verifiedAt: timestamp('verified_at'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  statusHistory: many(orderStatusHistory),
  changeRequests: many(orderChangeRequests),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
}));

export const orderChangeRequestsRelations = relations(orderChangeRequests, ({ one }) => ({
  order: one(orders, {
    fields: [orderChangeRequests.orderId],
    references: [orders.id],
  }),
}));
