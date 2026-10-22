import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import { products, banners, orders, orderStatusHistory, settings, users, coupons, wishlists, orderChangeRequests, adminLoginAttempts, subscriptions } from './src/db/schema.ts';
import { eq, and, desc, sql, ne, gte, count, inArray } from 'drizzle-orm';
import { requireAuth } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import multer from 'multer';
import fs from 'fs';
import { adminMessaging } from './src/lib/firebase-admin.ts';
import sharp from 'sharp';
import { GoogleGenAI } from '@google/genai';
import bcrypt from 'bcryptjs';

dotenv.config();

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(uploadsDir));

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DASHBOARD_SECRET = process.env.GEMINI_API_KEY || 'dashboard-secret-fallback';
const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'fancy-bazaar-customer-secret-key-2026';

// --- Price & Margin Helper (Strict Privacy: Supplier Cost & Internal Margins Never Shown to Customers) ---
const calculateProductPrices = (p: any) => {
  const regularPrice = parseFloat(p.sellingPrice as string) || 0;
  let premiumPrice = regularPrice;
  if (p.supplierCost && parseFloat(p.supplierCost as string) > 0) {
    premiumPrice = parseFloat(p.supplierCost as string);
  } else if (p.businessMargin && parseFloat(p.businessMargin as string) > 0) {
    premiumPrice = Math.max(1, regularPrice - parseFloat(p.businessMargin as string));
  } else {
    // Default: 25% internal margin removed for Premium VIP members
    premiumPrice = Math.round(regularPrice * 0.75);
  }
  // Formula: Discount percentage = ((Regular Price - Premium Price) / Regular Price) * 100
  const discountPercent = regularPrice > 0 
    ? Number((((regularPrice - premiumPrice) / regularPrice) * 100).toFixed(2)) 
    : 0;
  return {
    regularPrice,
    premiumPrice: Number(premiumPrice.toFixed(2)),
    discountPercent
  };
};

// --- Helpers ---

const generateOrderNumber = () => {
  return 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

const getSetting = async (key: string) => {
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0]?.value;
};

const updateSetting = async (key: string, value: any) => {
  await db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
};

// --- Initial Seed ---
const seedSettings = async () => {
  const adminPassword = await getSetting('admin_password');
  if (!adminPassword) {
    // Hash is simple for this task, but in real apps use bcrypt
    const hash = crypto.createHash('sha256').update('55080').digest('hex');
    await updateSetting('admin_password', { hash });
  }

  const upiSettings = await getSetting('upi_settings');
  if (!upiSettings) {
    await updateSetting('upi_settings', {
      upiId: '8925673304@ibl',
      merchantName: 'Fancy Bazaar Merchant',
      instructions: 'Please pay using any UPI app and share the UTR/Reference number below.'
    });
  }

  const generalSettings = await getSetting('general_settings');
  if (!generalSettings) {
    await updateSetting('general_settings', {
      websiteName: 'Fancy Bazaar',
      supportNumber: '8870472700',
      whatsappSupportNumber: '918870472700',
      defaultShipping: '50'
    });
  } else if ((generalSettings as any).websiteName === 'SwiftShop') {
    await updateSetting('general_settings', {
      ...generalSettings as any,
      websiteName: 'Fancy Bazaar'
    });
  }

  // Seed Customer Awards (Customer of the Month & Customer of the Year)
  const customerAwards = await getSetting('customer_awards');
  if (!customerAwards) {
    await updateSetting('customer_awards', {
      enabled: true,
      monthCustomer: {
        title: 'Customer of the Month',
        name: 'Rohan Verma',
        location: 'Patna, Bihar',
        reward: 'Top Shopper of June • ₹1,000 Voucher',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'
      },
      yearCustomer: {
        title: 'Customer of the Year',
        name: 'Pooja Sharma',
        location: 'Jaipur, Rajasthan',
        reward: 'VIP Diamond Member • Annual Gold Trophy & Gift Hamper',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400'
      }
    });
  }

  // Products are managed by admin (sample seeding disabled)

  // Update existing products to have stock between 1 and 10
  // and ensure images array is not empty
  const allProducts = await db.select().from(products);
  if (allProducts.length > 0) {
    for (const p of allProducts) {
      const updates: any = {};
      if (p.stock === null || p.stock < 1 || p.stock > 10) {
        updates.stock = Math.floor(Math.random() * 10) + 1;
      }
      if (!p.images || (Array.isArray(p.images) && p.images.length === 0)) {
        updates.images = [p.imageUrl];
      }
      
      // If image is broken /uploads path, replace with sample
      if (p.imageUrl && p.imageUrl.startsWith('/uploads/')) {
        updates.imageUrl = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop';
        updates.images = [updates.imageUrl];
      }

      if (Object.keys(updates).length > 0) {
        await db.update(products).set(updates).where(eq(products.id, p.id));
      }
    }
  }

  // Seed sample banner
  const existingBanners = await db.select().from(banners);
  if (existingBanners.length === 0) {
    await db.insert(banners).values({
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop',
      title: 'Mega Festive Sale',
      sortOrder: 0,
      isEnabled: true
    });
  } else {
    // Fix broken banner URLs
    for (const b of existingBanners) {
      if (b.imageUrl && b.imageUrl.startsWith('/uploads/')) {
        await db.update(banners)
          .set({ imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop' })
          .where(eq(banners.id, b.id));
      }
    }
  }

  // Seed sample coupon
  const couponCount = await db.select({ count: sql`count(*)` }).from(coupons);
  if ((couponCount[0].count as number) === 0) {
    await db.insert(coupons).values({
      code: 'WELCOME100',
      discountValue: '100',
      discountType: 'fixed',
      minPurchase: '500',
      isActive: true
    });
  }
};
seedSettings().catch(err => {
  console.error('Failed to seed settings:', err);
});

// --- Auth Routes ---

app.post('/api/dashboard/login', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  try {
    // Check 24-hour rate limit
    const failed24hResult = await db.select({ count: count() })
      .from(adminLoginAttempts)
      .where(
        and(
          eq(adminLoginAttempts.ip, ip),
          eq(adminLoginAttempts.isSuccess, false),
          gte(adminLoginAttempts.attemptedAt, twentyFourHoursAgo)
        )
      );
    
    const failedCount24h = failed24hResult[0]?.count || 0;
    if (failedCount24h >= 50) {
      return res.status(429).json({ error: 'Too many failed login attempts. Please try again after 24 hours.' });
    }

    // Check 1-minute rate limit
    const failed1mResult = await db.select({ count: count() })
      .from(adminLoginAttempts)
      .where(
        and(
          eq(adminLoginAttempts.ip, ip),
          eq(adminLoginAttempts.isSuccess, false),
          gte(adminLoginAttempts.attemptedAt, oneMinuteAgo)
        )
      );
    
    const failedCount1m = failed1mResult[0]?.count || 0;
    if (failedCount1m >= 3) {
      return res.status(429).json({ error: 'Too many attempts. Please wait for 1 minute before trying again.' });
    }

    const adminPasswordSetting = await getSetting('admin_password') as any;
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    if (hash === adminPasswordSetting.hash) {
      // Record success
      await db.insert(adminLoginAttempts).values({ ip, isSuccess: true });
      
      const token = jwt.sign({ role: 'admin' }, DASHBOARD_SECRET, { expiresIn: '24h' });
      res.json({ token });
    } else {
      // Record failure
      await db.insert(adminLoginAttempts).values({ ip, isSuccess: false });
      
      res.status(401).json({ error: `Incorrect password. Attempts remaining (this minute): ${2 - failedCount1m}. Total 24h attempts remaining: ${49 - failedCount24h}.` });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Customer Authentication Routes (Secure, Mobile-First, No Firebase) ---

app.post('/api/customer/signup', async (req, res) => {
  const { name, mobile, password, confirmPassword } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
  }

  const cleanMobile = (mobile || '').toString().trim().replace(/\D/g, '').slice(-10);
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(cleanMobile)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Please create a password.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Password must contain both letters and numbers for security.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match. Please re-enter.' });
  }

  try {
    // Check if mobile number is already registered
    const existing = await db.select().from(users).where(eq(users.mobile, cleanMobile)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'This mobile number is already registered. Please log in.' });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      name: name.trim(),
      mobile: cleanMobile,
      passwordHash,
      status: 'active',
      failedLoginAttempts: 0
    }).returning();

    // Check if this number has an active Premium Membership
    const activeSub = await checkActiveMembership(cleanMobile);

    const token = jwt.sign(
      { id: newUser.id, mobile: newUser.mobile, name: newUser.name, role: 'customer' },
      CUSTOMER_JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      customer: {
        id: newUser.id,
        name: newUser.name,
        mobile: newUser.mobile,
        isMember: Boolean(activeSub),
        subscription: activeSub
      }
    });
  } catch (error: any) {
    console.error('Customer signup error:', error);
    if (error?.code === '23505') {
      return res.status(400).json({ error: 'This mobile number is already registered. Please log in.' });
    }
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

app.post('/api/customer/login', async (req, res) => {
  const { mobile, password } = req.body;

  const cleanMobile = (mobile || '').toString().trim().replace(/\D/g, '').slice(-10);
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(cleanMobile)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Please enter your password.' });
  }

  try {
    const userResult = await db.select().from(users).where(eq(users.mobile, cleanMobile)).limit(1);
    if (userResult.length === 0) {
      return res.status(401).json({ error: 'Invalid mobile number or password.' });
    }

    const user = userResult[0];

    // Check temporary lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMs = new Date(user.lockedUntil).getTime() - Date.now();
      const remainingMins = Math.ceil(remainingMs / (60 * 1000));
      return res.status(429).json({
        error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMins} minute(s) or use "Forgot Password?" via WhatsApp.`
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Password not set. Please use "Forgot Password?" via WhatsApp.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let lockedUntil: Date | null = null;
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
      }

      await db.update(users).set({
        failedLoginAttempts: attempts,
        lockedUntil
      }).where(eq(users.id, user.id));

      if (attempts >= 5) {
        return res.status(429).json({
          error: 'Account temporarily locked for 15 minutes due to 5 failed login attempts. Please contact WhatsApp support to unlock.'
        });
      }

      return res.status(401).json({
        error: `Invalid mobile number or password. (${5 - attempts} attempts remaining before temporary lockout)`
      });
    }

    // Reset failed attempts on success
    await db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil: null
    }).where(eq(users.id, user.id));

    // Check active membership
    const activeSub = await checkActiveMembership(user.mobile!);

    const token = jwt.sign(
      { id: user.id, mobile: user.mobile, name: user.name, role: 'customer' },
      CUSTOMER_JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      customer: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        isMember: Boolean(activeSub),
        subscription: activeSub
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.get('/api/customer/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET) as any;
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const userResult = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const user = userResult[0];
    const activeSub = await checkActiveMembership(user.mobile!);

    res.json({
      customer: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        avatar: user.avatar || null,
        address: user.address || null,
        isMember: Boolean(activeSub),
        subscription: activeSub
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Session expired' });
  }
});

app.put('/api/customer/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET) as any;
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { name, avatar, address } = req.body;
    const updates: any = {};
    if (typeof name === 'string' && name.trim().length >= 2) {
      updates.name = name.trim();
    }
    if (typeof avatar === 'string') {
      updates.avatar = avatar;
    }
    if (address && typeof address === 'object') {
      updates.address = address;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }

    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, decoded.id)).returning();
    const activeSub = await checkActiveMembership(updatedUser.mobile!);

    res.json({
      success: true,
      customer: {
        id: updatedUser.id,
        name: updatedUser.name,
        mobile: updatedUser.mobile,
        avatar: updatedUser.avatar || null,
        address: updatedUser.address || null,
        isMember: Boolean(activeSub),
        subscription: activeSub
      }
    });
  } catch (err) {
    console.error('Customer profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.post('/api/customer/upload-avatar', upload.single('avatar'), async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET) as any;
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const compressed = await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const avatarUrl = `data:image/jpeg;base64,${compressed.toString('base64')}`;

    await db.update(users).set({ avatar: avatarUrl }).where(eq(users.id, decoded.id));

    res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

app.post('/api/customer/forgot-password-link', async (req, res) => {
  const { mobile } = req.body;
  const cleanMobile = (mobile || '').toString().trim().replace(/\D/g, '').slice(-10);
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(cleanMobile)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
  }

  const generalSettings = await getSetting('general_settings') as any;
  const rawSupport = generalSettings?.whatsappSupportNumber || generalSettings?.supportNumber || '918870472700';
  const cleanSupport = rawSupport.replace(/\D/g, '');
  const finalSupport = cleanSupport.startsWith('91') ? cleanSupport : `91${cleanSupport}`;

  const message = `Hello Fancy Bazaar Support, I forgot my password for my registered mobile number +91${cleanMobile}. Please help me reset my account password.`;
  const whatsappUrl = `https://wa.me/${finalSupport}?text=${encodeURIComponent(message)}`;

  res.json({
    whatsappUrl,
    supportNumber: finalSupport,
    message
  });
});

const requireDashboardAuth = (req: Request, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    jwt.verify(token, DASHBOARD_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session expired' });
  }
};

// --- Upload API ---

app.post('/api/upload', requireDashboardAuth, upload.any(), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  try {
    const urls = await Promise.all(files.map(async (file) => {
      try {
        // Automatic compression and resizing
        const compressedBuffer = await sharp(file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        const base64Image = compressedBuffer.toString('base64');
        return `data:image/jpeg;base64,${base64Image}`;
      } catch (err) {
        console.error(`Error processing file ${file.originalname}:`, err);
        // Fallback to original if compression fails (if it's already an image)
        const base64Image = file.buffer.toString('base64');
        return `data:${file.mimetype};base64,${base64Image}`;
      }
    }));
    
    res.json({ urls });
  } catch (error) {
    console.error('Upload process error:', error);
    res.status(500).json({ error: 'Failed to process images' });
  }
});

// --- Public API ---

app.get('/api/banners', async (req, res) => {
  const visibility = await getSetting('visibility_settings') as any;
  if (visibility?.allProductsHidden) {
    return res.json([]);
  }
  const result = await db.select().from(banners).where(eq(banners.isEnabled, true)).orderBy(banners.sortOrder);
  res.json(result);
});

app.get('/api/products', async (req, res) => {
  const result = await db.select().from(products).where(and(eq(products.isPublished, true), eq(products.availability, true)));
  
  const visibility = await getSetting('visibility_settings') as any;
  if (visibility?.allProductsHidden) {
    return res.json([]);
  }

  // Format products with strictly private pricing: supplierCost & businessMargin are never returned
  const formatted = result.map(p => {
    const { premiumPrice, discountPercent } = calculateProductPrices(p);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      originalPrice: p.originalPrice,
      sellingPrice: p.sellingPrice,
      premiumPrice: premiumPrice.toFixed(2),
      premiumDiscountPercent: discountPercent,
      discountValue: p.discountValue,
      discountType: p.discountType,
      shippingCharges: p.shippingCharges,
      additionalCharges: p.additionalCharges,
      category: p.category,
      averageRating: p.averageRating,
      availability: p.availability,
      isPublished: p.isPublished,
      imageUrl: p.imageUrl,
      images: p.images,
      colors: p.colors,
      sizes: p.sizes,
      badge: p.badge,
      stock: p.stock,
      platformFee: p.platformFee,
      specifications: p.specifications,
      isReturnable: p.isReturnable,
      createdAt: p.createdAt
    };
  });

  res.json(formatted);
});

app.get('/api/products/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });
  
  const visibility = await getSetting('visibility_settings') as any;
  if (visibility?.allProductsHidden) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (result.length === 0) return res.status(404).json({ error: 'Product not found' });
  
  const p = result[0];
  const { premiumPrice, discountPercent } = calculateProductPrices(p);

  res.json({
    id: p.id,
    name: p.name,
    description: p.description,
    originalPrice: p.originalPrice,
    sellingPrice: p.sellingPrice,
    premiumPrice: premiumPrice.toFixed(2),
    premiumDiscountPercent: discountPercent,
    discountValue: p.discountValue,
    discountType: p.discountType,
    shippingCharges: p.shippingCharges,
    additionalCharges: p.additionalCharges,
    category: p.category,
    averageRating: p.averageRating,
    availability: p.availability,
    isPublished: p.isPublished,
    imageUrl: p.imageUrl,
    images: p.images,
    colors: p.colors,
    sizes: p.sizes,
    badge: p.badge,
    stock: p.stock,
    platformFee: p.platformFee,
    specifications: p.specifications,
    isReturnable: p.isReturnable,
    createdAt: p.createdAt
  });
});

app.get('/api/products/:id/similar', async (req, res) => {
  const productId = parseInt(req.params.id);
  if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });
  const productResult = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  
  if (productResult.length === 0) return res.status(404).json({ error: 'Product not found' });
  const product = productResult[0];
  
  const category = product.category;
  const price = parseFloat(product.sellingPrice as string);
  const description = product.description || '';
  
  // Basic keywords from description (words longer than 3 chars)
  const keywords = description.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Fetch products from same category
  const candidates = await db.select({
    id: products.id,
    name: products.name,
    description: products.description,
    originalPrice: products.originalPrice,
    sellingPrice: products.sellingPrice,
    shippingCharges: products.shippingCharges,
    additionalCharges: products.additionalCharges,
    category: products.category,
    averageRating: products.averageRating,
    imageUrl: products.imageUrl,
    availability: products.availability,
    isPublished: products.isPublished,
    platformFee: products.platformFee
  }).from(products).where(and(
    eq(products.category, category as string),
    eq(products.isPublished, true),
    eq(products.availability, true),
    ne(products.id, productId)
  )).limit(20);

  // Rank candidates
  const scored = candidates.map(p => {
    let score = 0;
    
    // Price similarity (within 40% range)
    const pPrice = parseFloat(p.sellingPrice as string);
    const priceDiff = Math.abs(pPrice - price);
    if (priceDiff <= price * 0.4) score += 5;
    
    // Keyword matching
    const pDesc = (p.description || '').toLowerCase();
    const pName = p.name.toLowerCase();
    const matches = keywords.filter(k => pDesc.includes(k) || pName.includes(k)).length;
    score += matches * 2;
    
    return { ...p, score };
  });

  // Sort by score and return top 8
  const similar = scored.sort((a, b) => b.score - a.score).slice(0, 8);
  res.json(similar);
});

app.get('/api/settings/public', async (req, res) => {
  const upi = await getSetting('upi_settings');
  const gen = await getSetting('general_settings');
  const customerAwards = await getSetting('customer_awards');
  res.json({ upi, general: gen, customerAwards });
});

app.get('/api/customer-awards', async (req, res) => {
  const customerAwards = await getSetting('customer_awards');
  res.json(customerAwards || {
    enabled: true,
    monthCustomer: {
      title: 'Customer of the Month',
      name: 'Rohan Verma',
      location: 'Patna, Bihar',
      reward: 'Top Shopper of June • ₹1,000 Voucher',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'
    },
    yearCustomer: {
      title: 'Customer of the Year',
      name: 'Pooja Sharma',
      location: 'Jaipur, Rajasthan',
      reward: 'VIP Diamond Member • Annual Gold Trophy & Gift Hamper',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400'
    }
  });
});

// (Coupons API moved after checkActiveMembership)

// Wishlist API
app.get('/api/wishlist/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await db.select({
    product: products
  }).from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .where(eq(wishlists.userId, userId));
  
  res.json(result.map(r => r.product));
});

app.post('/api/wishlist', async (req, res) => {
  const { userId, productId } = req.body;
  if (!userId || !productId) return res.status(400).json({ error: 'userId and productId required' });

  // Check if already exists
  const existing = await db.select().from(wishlists).where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId))).limit(1);
  if (existing.length > 0) return res.json({ success: true });

  await db.insert(wishlists).values({ userId, productId });
  res.json({ success: true });
});

app.delete('/api/wishlist/:userId/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  const pId = parseInt(productId);
  if (isNaN(pId)) return res.status(400).json({ error: 'Invalid product ID' });
  await db.delete(wishlists).where(and(eq(wishlists.userId, userId), eq(wishlists.productId, pId)));
  res.json({ success: true });
});

app.delete('/api/wishlist/:userId', async (req, res) => {
  const { userId } = req.params;
  await db.delete(wishlists).where(eq(wishlists.userId, userId));
  res.json({ success: true });
});

// --- Premium Membership Subscriptions Helper & Public APIs ---

const checkActiveMembership = async (mobile?: string, userId?: string) => {
  if (!mobile && !userId) return null;
  const now = new Date();
  const cleanMobile = mobile ? mobile.toString().trim() : '';
  const cleanUserId = userId ? userId.toString().trim() : '';

  const conditions = [];
  if (cleanMobile) conditions.push(sql`${subscriptions.customerMobile} = ${cleanMobile}`);
  if (cleanUserId) conditions.push(sql`${subscriptions.userId} = ${cleanUserId}`);

  if (conditions.length === 0) return null;

  const activeSubs = await db.select().from(subscriptions).where(
    and(
      eq(subscriptions.status, 'Verified'),
      gte(subscriptions.endDate, now),
      sql`(${conditions.length > 1 ? sql.join(conditions, sql` OR `) : conditions[0]})`
    )
  ).orderBy(desc(subscriptions.endDate)).limit(1);

  return activeSubs.length > 0 ? activeSubs[0] : null;
};

// --- Customer & Public Coupons APIs ---
app.get('/api/coupons', async (req, res) => {
  try {
    const mobile = (req.query.mobile as string) || '';
    let isVip = false;
    if (mobile) {
      isVip = Boolean(await checkActiveMembership(mobile));
    }

    const allCoupons = await db.select().from(coupons).where(eq(coupons.isActive, true)).orderBy(desc(coupons.createdAt));
    
    // If VIP: return all active coupons ('all' and 'vip')
    // If not VIP: only return 'all' coupons
    const filtered = allCoupons.filter(c => {
      if (c.targetAudience === 'vip') {
        return isVip;
      }
      return true;
    });

    res.json(filtered);
  } catch (err) {
    console.error('Fetch coupons error:', err);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

app.post('/api/coupons/validate', async (req, res) => {
  const { code, amount, mobile } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code required' });

  const result = await db.select().from(coupons).where(and(eq(coupons.code, code.toUpperCase()), eq(coupons.isActive, true))).limit(1);
  
  if (result.length === 0) {
    return res.status(404).json({ error: 'Invalid or expired coupon code' });
  }

  const coupon = result[0];

  // Enforce VIP Only audience
  if (coupon.targetAudience === 'vip') {
    if (!mobile) {
      return res.status(403).json({ error: '👑 This coupon is exclusively for VIP Members. Please log in with your VIP account.' });
    }
    const isVip = await checkActiveMembership(mobile);
    if (!isVip) {
      return res.status(403).json({ error: '👑 This coupon is exclusively for VIP Members. Join VIP Club to use this coupon!' });
    }
  }

  const minPurchase = parseFloat(coupon.minPurchase as string);
  const currentAmount = parseFloat(amount);

  if (currentAmount < minPurchase) {
    return res.status(400).json({ error: `Minimum purchase of ₹${minPurchase} required for this coupon` });
  }

  res.json(coupon);
});

app.get('/api/subscriptions/status', async (req, res) => {
  const { mobile, userId } = req.query as { mobile?: string; userId?: string };
  if (!mobile && !userId) {
    return res.json({ isMember: false, status: 'None' });
  }

  const cleanMobile = mobile ? mobile.toString().trim() : '';
  const cleanUserId = userId ? userId.toString().trim() : '';
  const now = new Date();

  const conditions = [];
  if (cleanMobile) conditions.push(sql`${subscriptions.customerMobile} = ${cleanMobile}`);
  if (cleanUserId) conditions.push(sql`${subscriptions.userId} = ${cleanUserId}`);

  if (conditions.length === 0) {
    return res.json({ isMember: false, status: 'None' });
  }

  // 1. Check for Active Verified Subscription
  const verifiedSubs = await db.select().from(subscriptions).where(
    and(
      eq(subscriptions.status, 'Verified'),
      gte(subscriptions.endDate, now),
      sql`(${conditions.length > 1 ? sql.join(conditions, sql` OR `) : conditions[0]})`
    )
  ).orderBy(desc(subscriptions.endDate)).limit(1);

  if (verifiedSubs.length > 0) {
    const activeSub = verifiedSubs[0];
    const diffMs = new Date(activeSub.endDate!).getTime() - now.getTime();
    const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return res.json({
      isMember: true,
      status: 'Verified',
      subscription: activeSub,
      daysRemaining,
      message: `Premium Membership Active (${daysRemaining} days remaining)`
    });
  }

  // 2. Check for Pending Verification
  const pendingSubs = await db.select().from(subscriptions).where(
    and(
      eq(subscriptions.status, 'Pending Verification'),
      sql`(${conditions.length > 1 ? sql.join(conditions, sql` OR `) : conditions[0]})`
    )
  ).orderBy(desc(subscriptions.createdAt)).limit(1);

  if (pendingSubs.length > 0) {
    return res.json({
      isMember: false,
      status: 'Pending Verification',
      subscription: pendingSubs[0],
      message: 'Your payment is awaiting verification. Your Premium Membership will activate after admin approval.'
    });
  }

  // 3. Check for Rejected
  const rejectedSubs = await db.select().from(subscriptions).where(
    and(
      eq(subscriptions.status, 'Rejected'),
      sql`(${conditions.length > 1 ? sql.join(conditions, sql` OR `) : conditions[0]})`
    )
  ).orderBy(desc(subscriptions.createdAt)).limit(1);

  if (rejectedSubs.length > 0) {
    return res.json({
      isMember: false,
      status: 'Rejected',
      subscription: rejectedSubs[0],
      message: rejectedSubs[0].adminNotes || 'Your payment verification was rejected by admin. Please contact support or retry.'
    });
  }

  return res.json({ isMember: false, status: 'None' });
});

app.post('/api/subscriptions', async (req, res) => {
  const { customerName, customerMobile, customerEmail, utrNumber, userId } = req.body;

  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  const cleanMobile = (customerMobile || '').toString().trim();
  if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number' });
  }

  // UTR Number Validation
  const cleanedUtr = (utrNumber || '').toString().trim().toUpperCase();
  if (!cleanedUtr) {
    return res.status(400).json({ error: 'UTR number is mandatory. Please enter your 12-digit UPI UTR number from your payment receipt.' });
  }

  // Validate format without assuming single fixed length (e.g. 6 to 24 alphanumeric characters)
  if (!/^[A-Z0-9]{6,24}$/.test(cleanedUtr)) {
    return res.status(400).json({ error: 'Invalid UTR format. Please enter a valid 6-24 character alphanumeric UPI UTR/Reference number without spaces or symbols.' });
  }

  // Duplicate Check in subscriptions
  const existingSub = await db.select().from(subscriptions).where(sql`upper(${subscriptions.utrNumber}) = ${cleanedUtr}`).limit(1);
  if (existingSub.length > 0) {
    return res.status(400).json({ error: 'This UTR number has already been submitted for another subscription. Duplicate UTR submissions are strictly prohibited.' });
  }

  // Duplicate Check in orders
  const existingOrder = await db.select().from(orders).where(sql`upper(${orders.utrReference}) = ${cleanedUtr}`).limit(1);
  if (existingOrder.length > 0) {
    return res.status(400).json({ error: 'This UTR number is already associated with an order. Please submit a valid subscription payment UTR.' });
  }

  const subId = 'SUB-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);

  const [newSub] = await db.insert(subscriptions).values({
    subscriptionId: subId,
    customerName: customerName.trim(),
    customerMobile: cleanMobile,
    customerEmail: customerEmail ? customerEmail.trim() : null,
    userId: userId || null,
    amount: '299.00',
    paymentMethod: 'UPI',
    utrNumber: cleanedUtr,
    status: 'Pending Verification',
  }).returning();

  res.json({
    success: true,
    subscription: newSub,
    message: 'Your payment is awaiting verification. Your Premium Membership will activate after admin approval.'
  });
});

app.post('/api/orders', async (req, res) => {
  const { 
    items, 
    productId, 
    customerName, 
    customerMobile, 
    address, 
    paymentMethod, 
    quantity = 1, 
    couponCode, 
    selectedColor, 
    selectedSize, 
    paymentStatus: requestedPaymentStatus, 
    utrReference,
    userId
  } = req.body;

  // Active membership check
  const activeMembership = await checkActiveMembership(customerMobile, userId);

  // Cash on Delivery is strictly enabled only for active Verified Premium Members
  if (paymentMethod === 'COD' && !activeMembership) {
    return res.status(403).json({
      error: 'Cash on Delivery (COD) is exclusively available for Verified Premium Members. Please subscribe to Fancy Bazaar Premium to unlock Cash on Delivery.'
    });
  }

  const finalPaymentStatus = requestedPaymentStatus || (paymentMethod === 'COD' ? 'Pending' : 'Payment Verification Pending');

  // Multi-item Order Processing (Wishlist All Items Checkout)
  if (Array.isArray(items) && items.length > 0) {
    if (!customerName || !customerMobile || !address) {
      return res.status(400).json({ error: 'Customer details and address are required' });
    }

    const placedOrders: any[] = [];
    const baseOrderNumber = generateOrderNumber();
    let overallSubtotal = 0;

    // Validate all items first
    const validatedProducts: Array<{ productRow: any; item: any }> = [];
    for (const item of items) {
      const pId = parseInt(item.productId || item.id);
      if (isNaN(pId)) continue;
      const prodResult = await db.select().from(products).where(eq(products.id, pId)).limit(1);
      if (prodResult.length === 0 || !prodResult[0].availability || !prodResult[0].isPublished) {
        return res.status(400).json({ error: `Product "${item.name || pId}" is currently unavailable` });
      }
      const p = prodResult[0];
      const itemQty = parseInt(item.quantity) || 1;
      if (p.stock !== null && p.stock < itemQty) {
        return res.status(400).json({ error: `Not enough stock for "${p.name}". Available: ${p.stock}` });
      }
      validatedProducts.push({ productRow: p, item: { ...item, quantity: itemQty } });
      const baseSellingPrice = parseFloat(p.sellingPrice as string);
      const sellingPrice = activeMembership ? calculateProductPrices(p).premiumPrice : baseSellingPrice;
      const shipping = activeMembership ? 0 : parseFloat(p.shippingCharges as string || '0');
      const additional = parseFloat(p.additionalCharges as string || '0');
      const platformFee = parseFloat(p.platformFee as string || '0');
      overallSubtotal += (sellingPrice * itemQty) + shipping + additional + platformFee;
    }

    if (validatedProducts.length === 0) {
      return res.status(400).json({ error: 'No valid products in order' });
    }

    // Optional coupon discount distribution
    let couponDiscount = 0;
    if (couponCode) {
      const couponResult = await db.select().from(coupons).where(and(eq(coupons.code, couponCode.toUpperCase()), eq(coupons.isActive, true))).limit(1);
      if (couponResult.length > 0) {
        const c = couponResult[0];
        const isEligible = c.targetAudience !== 'vip' || Boolean(activeMembership);
        const minPurchase = parseFloat(c.minPurchase as string || '0');
        if (isEligible && overallSubtotal >= minPurchase) {
          if (c.discountType === 'fixed') {
            couponDiscount = parseFloat(c.discountValue as string);
          } else {
            couponDiscount = (overallSubtotal * parseFloat(c.discountValue as string)) / 100;
          }
        }
      }
    }

    const discountPerItem = couponDiscount > 0 ? (couponDiscount / validatedProducts.length) : 0;

    // Insert each order
    for (let i = 0; i < validatedProducts.length; i++) {
      const { productRow: p, item } = validatedProducts[i];
      const itemQty = item.quantity;
      const baseSellingPrice = parseFloat(p.sellingPrice as string);
      const sellingPrice = activeMembership ? calculateProductPrices(p).premiumPrice : baseSellingPrice;
      const shipping = activeMembership ? 0 : parseFloat(p.shippingCharges as string || '0');
      const additional = parseFloat(p.additionalCharges as string || '0');
      const platformFee = parseFloat(p.platformFee as string || '0');
      let itemFinalAmount = (sellingPrice * itemQty) + shipping + additional + platformFee - discountPerItem;
      if (itemFinalAmount < 0) itemFinalAmount = 0;

      const itemOrderNumber = validatedProducts.length > 1 ? `${baseOrderNumber}-${i + 1}` : baseOrderNumber;

      const productSnapshot = { 
        ...p,
        isReturnable: p.isReturnable !== false
      };

      const [newOrder] = await db.insert(orders).values({
        orderNumber: itemOrderNumber,
        customerName,
        customerMobile,
        address,
        productId: p.id,
        productSnapshot,
        selectedColor: item.selectedColor || null,
        selectedSize: item.selectedSize || null,
        quantity: itemQty,
        finalAmount: itemFinalAmount.toFixed(2),
        paymentMethod,
        paymentStatus: finalPaymentStatus,
        utrReference: utrReference || null,
        deliveryOtp: null,
        orderStatus: 'Order Placed'
      }).returning();

      // Decrement stock
      if (p.stock !== null) {
        await db.update(products)
          .set({ stock: sql`${products.stock} - ${itemQty}` })
          .where(eq(products.id, p.id));
      }

      await db.insert(orderStatusHistory).values({
        orderId: newOrder.id,
        status: 'Order Placed',
        notes: `Wishlist bundle order placed (${i + 1}/${validatedProducts.length}) with ${paymentMethod}`
      });

      if (finalPaymentStatus === 'Verified') {
        await db.insert(orderStatusHistory).values({
          orderId: newOrder.id,
          status: 'Payment Verified',
          notes: `Payment of ₹${itemFinalAmount.toFixed(2)} verified via ${paymentMethod}`
        });
      }

      placedOrders.push(newOrder);
    }

    const totalCombinedAmount = placedOrders.reduce((sum, o) => sum + parseFloat(o.finalAmount), 0);

    return res.json({
      success: true,
      isMultiOrder: true,
      orders: placedOrders,
      primaryOrder: placedOrders[0],
      totalAmount: totalCombinedAmount.toFixed(2),
      orderNumber: baseOrderNumber,
      // For backward compatibility
      ...placedOrders[0],
      finalAmount: totalCombinedAmount.toFixed(2)
    });
  }

  // Single Product Checkout
  const pId = parseInt(productId);
  if (isNaN(pId)) return res.status(400).json({ error: 'Invalid product ID' });

  const product = await db.select().from(products).where(eq(products.id, pId)).limit(1);
  if (product.length === 0 || !product[0].availability || !product[0].isPublished) {
    return res.status(400).json({ error: 'Product unavailable' });
  }

  if (product[0].stock !== null && product[0].stock < quantity) {
    return res.status(400).json({ error: 'Not enough stock available' });
  }

  const p = product[0];
  const baseSellingPrice = parseFloat(p.sellingPrice as string);
  const sellingPrice = activeMembership ? calculateProductPrices(p).premiumPrice : baseSellingPrice;
  const shipping = activeMembership ? 0 : parseFloat(p.shippingCharges as string);
  const additional = parseFloat(p.additionalCharges as string);
  const platformFee = parseFloat(p.platformFee as string || '0');
  let finalAmount = (sellingPrice * quantity) + shipping + additional + platformFee;

  let appliedCoupon = null;
  if (couponCode) {
    const couponResult = await db.select().from(coupons).where(and(eq(coupons.code, couponCode.toUpperCase()), eq(coupons.isActive, true))).limit(1);
    if (couponResult.length > 0) {
      const c = couponResult[0];
      const activeMember = await checkActiveMembership(customerMobile);
      const isEligible = c.targetAudience !== 'vip' || Boolean(activeMember);
      const minPurchase = parseFloat(c.minPurchase as string);
      if (isEligible && finalAmount >= minPurchase) {
        appliedCoupon = c;
        let discount = 0;
        if (c.discountType === 'fixed') {
          discount = parseFloat(c.discountValue as string);
        } else {
          discount = (finalAmount * parseFloat(c.discountValue as string)) / 100;
        }
        finalAmount -= discount;
      }
    }
  }

  if (finalAmount < 0) finalAmount = 0;

  const orderNumber = generateOrderNumber();

  // Create a snapshot for the order, including sourceUrl for admin reference
  const productSnapshot = { 
    ...p,
    isReturnable: p.isReturnable !== false
  };

  const [newOrder] = await db.insert(orders).values({
    orderNumber,
    customerName,
    customerMobile,
    address,
    productId,
    productSnapshot,
    selectedColor,
    selectedSize,
    quantity,
    finalAmount: finalAmount.toString(),
    paymentMethod,
    paymentStatus: finalPaymentStatus,
    utrReference: utrReference || null,
    deliveryOtp: null,
    orderStatus: 'Order Placed'
  }).returning();

  // Decrement stock
  if (product[0].stock !== null) {
    await db.update(products)
      .set({ stock: sql`${products.stock} - ${quantity}` })
      .where(eq(products.id, productId));
  }

  await db.insert(orderStatusHistory).values({
    orderId: newOrder.id,
    status: 'Order Placed',
    notes: `Order created with payment method ${paymentMethod} and quantity ${quantity}`
  });

  if (finalPaymentStatus === 'Verified') {
    await db.insert(orderStatusHistory).values({
      orderId: newOrder.id,
      status: 'Payment Verified',
      notes: `Payment of ₹${finalAmount} successfully deducted via ${paymentMethod}`
    });
  }

  res.json(newOrder);
});

app.post('/api/orders/upi-verify', async (req, res) => {
  const { orderId, utr, autoVerify } = req.body;
  if (!utr && !autoVerify) return res.status(400).json({ error: 'UTR or verification required' });

  const oId = parseInt(orderId);
  if (isNaN(oId)) return res.status(400).json({ error: 'Invalid order ID' });

  const status = autoVerify ? 'Verified' : 'Payment Verification Pending';
  const finalUtr = utr || `UPI_DEDUCTED_${Date.now()}`;

  await db.update(orders).set({
    utrReference: finalUtr,
    paymentStatus: status
  }).where(eq(orders.id, oId));

  if (autoVerify) {
    await db.insert(orderStatusHistory).values({
      orderId: oId,
      status: 'Payment Verified',
      notes: `Payment of order ${oId} deducted and verified via UPI (${finalUtr})`
    });
  }

  res.json({ success: true, paymentStatus: status, message: autoVerify ? 'Payment deducted and verified successfully!' : 'Your payment details have been submitted. We are verifying your transaction. Your order will be confirmed after successful payment verification.' });
});

app.post('/api/orders/track', async (req, res) => {
  const { orderNumber, mobile } = req.body;
  const result = await db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    customerName: orders.customerName,
    finalAmount: orders.finalAmount,
    paymentMethod: orders.paymentMethod,
    paymentStatus: orders.paymentStatus,
    orderStatus: orders.orderStatus,
    createdAt: orders.createdAt,
    productSnapshot: orders.productSnapshot,
    quantity: orders.quantity,
    cancellationReason: orders.cancellationReason,
    deliveryOtp: orders.deliveryOtp,
    deliveryReason: orders.deliveryReason,
    deliveryVerifiedWithOtp: orders.deliveryVerifiedWithOtp,
    productId: orders.productId
  }).from(orders).where(and(eq(orders.orderNumber, orderNumber), eq(orders.customerMobile, mobile))).limit(1);

  if (result.length === 0) return res.status(404).json({ error: 'Order not found' });

  const history = await db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, result[0].id)).orderBy(desc(orderStatusHistory.updatedAt));

  // Sanitize snapshot for public view
  const sanitizedOrder = { ...result[0] };
  if (sanitizedOrder.productSnapshot) {
    delete (sanitizedOrder.productSnapshot as any).sourceUrl;
  }

  // Determine returnability accurately from snapshot and live product table
  let isReturnable = (sanitizedOrder.productSnapshot as any)?.isReturnable;
  if (result[0].productId) {
    const prod = await db.select({ isReturnable: products.isReturnable }).from(products).where(eq(products.id, result[0].productId)).limit(1);
    if (prod.length > 0 && prod[0].isReturnable !== null && prod[0].isReturnable !== undefined) {
      if (prod[0].isReturnable === false) {
        isReturnable = false;
      }
    }
  }
  const finalReturnable = isReturnable !== false;
  (sanitizedOrder as any).isReturnable = finalReturnable;
  // Sanitize history notes for customer view: NEVER expose internal admin notes or manual OTP strings
  const sanitizedHistory = history.map(item => {
    let cleanNotes = item.notes;
    if (cleanNotes && /admin|manual\s*otp/i.test(cleanNotes)) {
      if (item.status === 'Out for Delivery') {
        cleanNotes = 'Package is out for delivery with courier.';
      } else if (item.status === 'Delivered') {
        cleanNotes = 'Delivered successfully.';
      } else {
        cleanNotes = null;
      }
    }
    return { ...item, notes: cleanNotes };
  });

  res.json({ order: sanitizedOrder, history: sanitizedHistory });
});

app.post('/api/orders/my-orders', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number required' });

  const result = await db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    customerName: orders.customerName,
    finalAmount: orders.finalAmount,
    paymentMethod: orders.paymentMethod,
    paymentStatus: orders.paymentStatus,
    orderStatus: orders.orderStatus,
    createdAt: orders.createdAt,
    productSnapshot: orders.productSnapshot,
    quantity: orders.quantity,
    deliveryOtp: orders.deliveryOtp,
    deliveryReason: orders.deliveryReason,
    deliveryVerifiedWithOtp: orders.deliveryVerifiedWithOtp,
    productId: orders.productId
  }).from(orders).where(eq(orders.customerMobile, mobile)).orderBy(desc(orders.createdAt));

  // Sanitize snapshots
  const sanitizedResult = result.map(order => {
    const sanitized = { ...order };
    if (sanitized.productSnapshot) {
      delete (sanitized.productSnapshot as any).sourceUrl;
    }
    return sanitized;
  });

  res.json(sanitizedResult);
});

// --- Order Change Requests API ---

app.post('/api/orders/:id/change-requests', async (req, res) => {
  const orderId = parseInt(req.params.id);
  if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID' });
  const { type, requestedValue, mobile } = req.body;
  const clientMobile = mobile || requestedValue?.customerMobile || requestedValue?.mobile;

  if (!clientMobile) return res.status(400).json({ error: 'Mobile number required' });

  // Verify order belongs to mobile
  const orderResult = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.customerMobile, clientMobile))).limit(1);
  if (orderResult.length === 0) return res.status(404).json({ error: 'Order not found' });

  const order = orderResult[0];

  if (type === 'cancel') {
    // Check 24h limit
    const createdAt = new Date(order.createdAt as Date);
    const now = new Date();
    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) {
      return res.status(400).json({ error: 'Order cancellation is only allowed within 24 hours' });
    }
  }

  if (type === 'return') {
    let isReturnable = (order.productSnapshot as any)?.isReturnable;
    if (order.productId) {
      const prod = await db.select({ isReturnable: products.isReturnable }).from(products).where(eq(products.id, order.productId)).limit(1);
      if (prod.length > 0 && prod[0].isReturnable !== null && prod[0].isReturnable !== undefined) {
        if (prod[0].isReturnable === false) {
          isReturnable = false;
        }
      }
    }
    if (isReturnable === false) {
      return res.status(400).json({ 
        error: 'This product is non-returnable (इस उत्पाद पर रिटर्न मान्य नहीं है). Return requests cannot be accepted for this item.' 
      });
    }
  }

  if (type === 'replacement') {
    // Replacement is supported on ALL products for valid reasons (Damaged, Defect, Wrong, Empty Box)
    const { reason, description, photoUrl } = requestedValue || {};
    if (!reason) {
      return res.status(400).json({ error: 'Please select a reason for replacement' });
    }
    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a brief description of the issue (minimum 5 characters)' });
    }
    if (!photoUrl) {
      return res.status(400).json({ error: 'Please upload a photo of the defect, damaged product or empty box' });
    }
  }

  // Check if pending request already exists
  const existing = await db.select().from(orderChangeRequests).where(and(
    eq(orderChangeRequests.orderId, orderId),
    eq(orderChangeRequests.type, type),
    eq(orderChangeRequests.status, 'pending')
  )).limit(1);

  if (existing.length > 0) {
    return res.status(400).json({ error: `A pending ${type} request already exists for this order` });
  }

  await db.insert(orderChangeRequests).values({
    orderId,
    type,
    requestedValue,
    status: 'pending'
  });

  res.json({ 
    success: true, 
    message: type === 'replacement' 
      ? 'Replacement request submitted successfully! Admin will review your photo proof and description.' 
      : 'Your request has been submitted and is pending admin approval.' 
  });
});

// Replacement Photo Upload endpoint
app.post('/api/orders/upload-replacement-photo', upload.single('photo'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      if (req.body?.photoBase64) {
        return res.json({ success: true, photoUrl: req.body.photoBase64 });
      }
      return res.status(400).json({ error: 'No photo file uploaded' });
    }

    const filename = `replacement-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(filepath);

    const photoUrl = `/uploads/${filename}`;
    res.json({ success: true, photoUrl });
  } catch (err: any) {
    console.error('Upload replacement photo error:', err);
    res.status(500).json({ error: 'Failed to upload replacement photo' });
  }
});

// Admin endpoints
app.get('/api/dashboard/subscriptions', requireDashboardAuth, async (req, res) => {
  const list = await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  const totalCount = list.length;
  const pendingCount = list.filter(s => s.status === 'Pending Verification').length;
  const verifiedCount = list.filter(s => s.status === 'Verified').length;
  const rejectedCount = list.filter(s => s.status === 'Rejected').length;
  const totalRevenue = verifiedCount * 299;

  res.json({
    subscriptions: list,
    stats: {
      totalCount,
      pendingCount,
      verifiedCount,
      rejectedCount,
      totalRevenue
    }
  });
});

app.post('/api/dashboard/subscriptions/:id/verify', requireDashboardAuth, async (req, res) => {
  const subId = parseInt(req.params.id);
  if (isNaN(subId)) return res.status(400).json({ error: 'Invalid subscription ID' });

  const { action, adminNotes, verifiedBy } = req.body;
  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
  }

  const existing = await db.select().from(subscriptions).where(eq(subscriptions.id, subId)).limit(1);
  if (existing.length === 0) return res.status(404).json({ error: 'Subscription not found' });

  const now = new Date();
  const adminName = verifiedBy || 'Admin';

  if (action === 'approve') {
    const startDate = now;
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days validity

    const [updated] = await db.update(subscriptions)
      .set({
        status: 'Verified',
        verifiedBy: adminName,
        verifiedAt: now,
        startDate,
        endDate,
        adminNotes: adminNotes ? adminNotes.trim() : 'Payment verified by Admin after transaction check'
      })
      .where(eq(subscriptions.id, subId))
      .returning();

    return res.json({
      success: true,
      subscription: updated,
      message: 'Subscription payment approved! Premium membership is now active for 30 days.'
    });
  } else {
    const [updated] = await db.update(subscriptions)
      .set({
        status: 'Rejected',
        verifiedBy: adminName,
        verifiedAt: now,
        adminNotes: adminNotes ? adminNotes.trim() : 'Payment rejected by Admin (unverified transaction or invalid UTR)'
      })
      .where(eq(subscriptions.id, subId))
      .returning();

    return res.json({
      success: true,
      subscription: updated,
      message: 'Subscription payment marked as Rejected. Membership remains inactive.'
    });
  }
});
app.get('/api/dashboard/change-requests', requireDashboardAuth, async (req, res) => {
  const result = await db.select({
    request: orderChangeRequests,
    order: orders
  }).from(orderChangeRequests)
    .innerJoin(orders, eq(orderChangeRequests.orderId, orders.id))
    .orderBy(desc(orderChangeRequests.createdAt));
  
  res.json(result);
});

app.post('/api/dashboard/change-requests/:id/respond', requireDashboardAuth, async (req, res) => {
  const requestId = parseInt(req.params.id);
  if (isNaN(requestId)) return res.status(400).json({ error: 'Invalid request ID' });
  const { status, adminNotes } = req.body; // status: 'approved' or 'rejected'

  const requestResult = await db.select().from(orderChangeRequests).where(eq(orderChangeRequests.id, requestId)).limit(1);
  if (requestResult.length === 0) return res.status(404).json({ error: 'Request not found' });

  const request = requestResult[0];
  const orderId = request.orderId;

  if (status === 'approved') {
    if (request.type === 'cancel') {
      await db.update(orders).set({ orderStatus: 'Cancelled', cancellationReason: 'Customer requested cancellation' }).where(eq(orders.id, orderId));
      await db.insert(orderStatusHistory).values({
        orderId,
        status: 'Cancelled',
        notes: 'Order cancelled as requested by customer'
      });
    } else if (request.type === 'address') {
      await db.update(orders).set({ address: request.requestedValue }).where(eq(orders.id, orderId));
      await db.insert(orderStatusHistory).values({
        orderId,
        status: 'Address Updated',
        notes: 'Order address updated as requested by customer'
      });
    } else if (request.type === 'mobile') {
      await db.update(orders).set({ customerMobile: (request.requestedValue as any).mobile }).where(eq(orders.id, orderId));
      await db.insert(orderStatusHistory).values({
        orderId,
        status: 'Mobile Updated',
        notes: 'Customer mobile updated as requested by customer'
      });
    } else if (request.type === 'return') {
      await db.update(orders).set({ orderStatus: 'Returned' }).where(eq(orders.id, orderId));
      await db.insert(orderStatusHistory).values({
        orderId,
        status: 'Returned',
        notes: 'Order return request approved by admin'
      });
    } else if (request.type === 'replacement') {
      await db.update(orders).set({ orderStatus: 'Replacement In Progress' }).where(eq(orders.id, orderId));
      await db.insert(orderStatusHistory).values({
        orderId,
        status: 'Replacement In Progress',
        notes: `Replacement approved by admin: ${adminNotes || 'New replacement package is being prepared.'}`
      });
    }
  } else if (status === 'rejected' && request.type === 'replacement') {
    await db.insert(orderStatusHistory).values({
      orderId,
      status: 'Replacement Declined',
      notes: `Replacement request declined by admin: ${adminNotes || 'Declined'}`
    });
  }

  await db.update(orderChangeRequests).set({
    status,
    adminNotes,
    updatedAt: new Date()
  }).where(eq(orderChangeRequests.id, requestId));

  res.json({ success: true });
});

// --- Dashboard Protected API ---

app.get('/api/dashboard/stats', requireDashboardAuth, async (req, res) => {
  const totalOrders = await db.select({ count: sql`count(*)` }).from(orders);
  const paidOrders = await db.select({ count: sql`count(*)` }).from(orders).where(eq(orders.paymentStatus, 'Verified'));
  const pendingVerification = await db.select({ count: sql`count(*)` }).from(orders).where(eq(orders.paymentStatus, 'Payment Verification Pending'));
  const totalValue = await db.select({ sum: sql`sum(final_amount)` }).from(orders).where(eq(orders.paymentStatus, 'Verified'));
  const totalProducts = await db.select({ count: sql`count(*)` }).from(products);
  const pendingSubscriptions = await db.select({ count: sql`count(*)` }).from(subscriptions).where(eq(subscriptions.status, 'Pending Verification'));
  const verifiedSubscriptions = await db.select({ count: sql`count(*)` }).from(subscriptions).where(eq(subscriptions.status, 'Verified'));

  res.json({
    totalOrders: totalOrders[0].count,
    paidOrders: paidOrders[0].count,
    pendingVerification: pendingVerification[0].count,
    totalValue: totalValue[0].sum || 0,
    totalProducts: totalProducts[0].count,
    pendingSubscriptions: pendingSubscriptions[0].count,
    verifiedSubscriptions: verifiedSubscriptions[0].count
  });
});

app.get('/api/dashboard/orders', requireDashboardAuth, async (req, res) => {
  const result = await db.select().from(orders).orderBy(desc(orders.createdAt));
  res.json(result);
});

app.get('/api/dashboard/orders/:id', requireDashboardAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid order ID' });
  const order = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (order.length === 0) return res.status(404).json({ error: 'Order not found' });
  const history = await db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(desc(orderStatusHistory.updatedAt));
  res.json({ order: order[0], history });
});

app.put('/api/dashboard/orders/:id/status', requireDashboardAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid order ID' });
  const { status, notes, cancellationReason, deliveryOtpInput, deliveryReason, manualOtp } = req.body;

  const [existingOrder] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!existingOrder) return res.status(404).json({ error: 'Order not found' });

  const updateData: any = { orderStatus: status };
  let statusNote = notes || '';

  // 1. If moving to 'Out for Delivery', admin manually provides the OTP
  if (status === 'Out for Delivery') {
    const cleanManualOtp = (manualOtp || deliveryOtpInput || '').toString().trim();
    if (!cleanManualOtp && !existingOrder.deliveryOtp) {
      return res.status(400).json({ error: 'Please enter a manual Delivery OTP for customer before marking Out for Delivery.' });
    }
    if (cleanManualOtp) {
      updateData.deliveryOtp = cleanManualOtp;
      statusNote = statusNote || 'Package is out for delivery with courier.';
    }
  }

  // Allow admin to update manualOtp directly
  if (manualOtp && manualOtp.toString().trim()) {
    updateData.deliveryOtp = manualOtp.toString().trim();
  }

  // 2. If moving to 'Delivered', verify OTP or require admin delivery reason
  if (status === 'Delivered') {
    const cleanOtpInput = (deliveryOtpInput || '').toString().trim();
    const cleanReason = (deliveryReason || '').toString().trim();
    const activeTargetOtp = updateData.deliveryOtp || existingOrder.deliveryOtp;

    if (cleanOtpInput) {
      if (activeTargetOtp && cleanOtpInput !== activeTargetOtp) {
        return res.status(400).json({ 
          error: `Incorrect Delivery OTP "${cleanOtpInput}". The OTP set for this order is "${activeTargetOtp}". Please enter the correct OTP or choose "OTP Unavailable" with reason.` 
        });
      }
      updateData.deliveryVerifiedWithOtp = true;
      updateData.deliveryReason = null;
      statusNote = statusNote || 'Package delivered successfully.';
    } else if (cleanReason) {
      updateData.deliveryVerifiedWithOtp = false;
      updateData.deliveryReason = cleanReason;
      statusNote = statusNote ? `${statusNote}` : (cleanReason ? `Delivery note: ${cleanReason}` : 'Delivered successfully.');
    } else {
      return res.status(400).json({ 
        error: 'Delivery OTP or reason for missing OTP is required to mark order as Delivered.' 
      });
    }
  }

  if (cancellationReason) {
    updateData.cancellationReason = cancellationReason;
  }
  await db.update(orders).set(updateData).where(eq(orders.id, id));
  
  // Send Push Notification
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (order && order.fcmToken) {
    try {
      const activeOtp = updateData.deliveryOtp || existingOrder.deliveryOtp;
      await adminMessaging.send({
        token: order.fcmToken,
        notification: {
          title: 'Order Status Updated',
          body: status === 'Out for Delivery' 
            ? `Your order #${order.orderNumber} is Out for Delivery! Share Delivery OTP: ${activeOtp} with courier.`
            : `Your order #${order.orderNumber} is now ${status}.`
        },
        data: {
          orderId: order.id.toString(),
          orderNumber: order.orderNumber
        }
      });
      console.log(`Notification sent to order ${order.orderNumber}`);
    } catch (error) {
      console.error('Error sending FCM notification:', error);
    }
  }

  await db.insert(orderStatusHistory).values({
    orderId: id,
    status,
    notes: cancellationReason ? `Cancelled: ${cancellationReason}` : statusNote
  });
  res.json({ 
    success: true, 
    deliveryOtp: updateData.deliveryOtp || existingOrder.deliveryOtp,
    deliveryReason: updateData.deliveryReason || null
  });
});

app.put('/api/dashboard/orders/:id/payment', requireDashboardAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid order ID' });
  const { status } = req.body;
  await db.update(orders).set({ paymentStatus: status }).where(eq(orders.id, id));
  res.json({ success: true });
});

app.put('/api/dashboard/orders/:id/delivery-otp', requireDashboardAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid order ID' });
  const { deliveryOtp } = req.body;
  const cleanOtp = (deliveryOtp || '').toString().trim();
  if (!cleanOtp) {
    return res.status(400).json({ error: 'Please enter a manual OTP (cannot be empty).' });
  }

  const [existingOrder] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!existingOrder) return res.status(404).json({ error: 'Order not found' });

  await db.update(orders).set({ deliveryOtp: cleanOtp }).where(eq(orders.id, id));

  await db.insert(orderStatusHistory).values({
    orderId: id,
    status: existingOrder.orderStatus || 'Order Placed',
    notes: 'Delivery details updated'
  });

  res.json({ success: true, deliveryOtp: cleanOtp });
});

app.post('/api/orders/:orderNumber/fcm-token', async (req, res) => {
  const { orderNumber } = req.params;
  const { fcmToken, mobile } = req.body;

  if (!fcmToken || !mobile) return res.status(400).json({ error: 'Token and mobile required' });

  await db.update(orders)
    .set({ fcmToken })
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.customerMobile, mobile)));

  res.json({ success: true });
});

// Products Management
app.get('/api/dashboard/products', requireDashboardAuth, async (req, res) => {
  const result = await db.select().from(products).orderBy(desc(products.createdAt));
  res.json(result);
});

// Customers Management in Dashboard
app.get('/api/dashboard/customers', requireDashboardAuth, async (req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      mobile: users.mobile,
      status: users.status,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
      createdAt: users.createdAt
    }).from(users).orderBy(desc(users.createdAt));

    const now = new Date();
    const allSubscriptions = await db.select().from(subscriptions).where(
      and(
        eq(subscriptions.status, 'Verified'),
        gte(subscriptions.endDate, now)
      )
    );

    const activeMobileMap = new Set(allSubscriptions.map(s => s.customerMobile));

    // Fetch all orders to compute total shopping amount and order count
    const allOrders = await db.select({
      customerMobile: orders.customerMobile,
      finalAmount: orders.finalAmount,
      orderStatus: orders.orderStatus,
      createdAt: orders.createdAt
    }).from(orders);

    const customerSpendMap = new Map<string, { totalSpent: number; totalOrders: number; lastOrderAt: Date | null }>();

    for (const ord of allOrders) {
      if (!ord.customerMobile) continue;
      const mob = ord.customerMobile.trim();
      const existing = customerSpendMap.get(mob) || { totalSpent: 0, totalOrders: 0, lastOrderAt: null };

      const amount = parseFloat(ord.finalAmount || '0') || 0;
      if (ord.orderStatus !== 'Cancelled' && ord.orderStatus !== 'Payment Failed') {
        existing.totalSpent += amount;
      }
      existing.totalOrders += 1;
      if (!existing.lastOrderAt || (ord.createdAt && new Date(ord.createdAt) > new Date(existing.lastOrderAt))) {
        existing.lastOrderAt = ord.createdAt;
      }
      customerSpendMap.set(mob, existing);
    }

    const result = allUsers.map(u => {
      const mob = u.mobile ? u.mobile.trim() : '';
      const spendInfo = customerSpendMap.get(mob) || { totalSpent: 0, totalOrders: 0, lastOrderAt: null };
      return {
        ...u,
        isMember: mob ? activeMobileMap.has(mob) : false,
        totalSpent: Math.round(spendInfo.totalSpent * 100) / 100,
        totalOrders: spendInfo.totalOrders,
        lastOrderAt: spendInfo.lastOrderAt
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching dashboard customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/dashboard/customers/:id/reset-password', requireDashboardAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid customer ID' });
  
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null
    }).where(eq(users.id, id));

    res.json({ success: true, message: 'Password reset successfully!' });
  } catch (err) {
    console.error('Error resetting customer password:', err);
    res.status(500).json({ error: 'Failed to reset customer password' });
  }
});

const sanitizeProductData = (data: any) => {
  const sanitized = { ...data };
  
  // Convert numeric fields from strings to numbers/nulls to prevent DB errors
  const numericFields = [
    'originalPrice', 'sellingPrice', 'discountValue', 'shippingCharges', 
    'additionalCharges', 'averageRating', 'platformFee', 'supplierCost', 'businessMargin'
  ];
  numericFields.forEach(field => {
    if (sanitized[field] === '' || sanitized[field] === undefined || sanitized[field] === null) {
      delete sanitized[field]; // Let DB use default or be NULL
    }
  });

  // Calculate supplierCost and businessMargin balance if sellingPrice is provided
  if (sanitized.sellingPrice) {
    const sp = parseFloat(sanitized.sellingPrice);
    if (sanitized.supplierCost && !sanitized.businessMargin) {
      const sc = parseFloat(sanitized.supplierCost);
      sanitized.businessMargin = Math.max(0, sp - sc).toFixed(2);
    } else if (sanitized.businessMargin && !sanitized.supplierCost) {
      const bm = parseFloat(sanitized.businessMargin);
      sanitized.supplierCost = Math.max(0, sp - bm).toFixed(2);
    } else if (!sanitized.supplierCost && !sanitized.businessMargin) {
      const sc = Math.round(sp * 0.75);
      sanitized.supplierCost = sc.toFixed(2);
      sanitized.businessMargin = (sp - sc).toFixed(2);
    }
  }

  // Ensure stock is an integer
  if (sanitized.stock !== undefined) {
    const stockVal = parseInt(sanitized.stock as string);
    if (isNaN(stockVal)) {
      delete sanitized.stock;
    } else {
      sanitized.stock = stockVal;
    }
  }

  // Ensure boolean fields are actually booleans
  if (typeof sanitized.availability === 'string') sanitized.availability = sanitized.availability === 'true' || sanitized.availability === 'on';
  if (typeof sanitized.isPublished === 'string') sanitized.isPublished = sanitized.isPublished === 'true' || sanitized.isPublished === 'on';
  if (sanitized.isReturnable !== undefined && sanitized.isReturnable !== null) {
    if (typeof sanitized.isReturnable === 'string') {
      sanitized.isReturnable = sanitized.isReturnable === 'true' || sanitized.isReturnable === 'on' || sanitized.isReturnable === '1';
    } else {
      sanitized.isReturnable = Boolean(sanitized.isReturnable);
    }
  } else {
    sanitized.isReturnable = true;
  }

  // Remove keys that are not in the schema or should not be updated
  delete sanitized.id;
  delete sanitized.createdAt;
  delete sanitized.updatedAt;
  delete sanitized.selectedColors; // In case it was passed by mistake
  delete sanitized.selectedSizes; // In case it was passed by mistake

  // Ensure images is an array of non-empty strings
  if (typeof sanitized.images === 'string') {
    try {
      sanitized.images = JSON.parse(sanitized.images);
    } catch {
      sanitized.images = sanitized.images.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(sanitized.images)) {
    sanitized.images = sanitized.images.map((s: any) => typeof s === 'string' ? s.trim() : '').filter(Boolean);
    if (sanitized.images.length > 0 && !sanitized.imageUrl) {
      sanitized.imageUrl = sanitized.images[0];
    }
  } else if (sanitized.imageUrl) {
    sanitized.images = [sanitized.imageUrl];
  }

  if (sanitized.specifications !== undefined) {
    if (typeof sanitized.specifications === 'string') {
      try {
        sanitized.specifications = JSON.parse(sanitized.specifications);
      } catch {
        sanitized.specifications = {};
      }
    }
    // Clean out empty keys so details not provided by admin are never stored
    if (typeof sanitized.specifications === 'object' && sanitized.specifications !== null) {
      const cleaned: any = {};
      for (const [sectionKey, sectionVal] of Object.entries(sanitized.specifications)) {
        if (typeof sectionVal === 'object' && sectionVal !== null) {
          const subCleaned: any = {};
          for (const [k, v] of Object.entries(sectionVal)) {
            if (typeof v === 'string' && v.trim() !== '') {
              subCleaned[k] = v.trim();
            } else if (typeof v === 'boolean' || typeof v === 'number') {
              subCleaned[k] = v;
            }
          }
          if (Object.keys(subCleaned).length > 0) {
            cleaned[sectionKey] = subCleaned;
          }
        } else if (typeof sectionVal === 'string' && sectionVal.trim() !== '') {
          cleaned[sectionKey] = sectionVal.trim();
        }
      }
      sanitized.specifications = cleaned;
    }
  }

  return sanitized;
};

app.get('/api/dashboard/sales-analytics', requireDashboardAuth, async (req, res) => {
  // Get sales for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sales = await db.select({
    date: sql`DATE(created_at)`,
    totalAmount: sql`SUM(final_amount)`,
    count: sql`COUNT(*)`
  })
  .from(orders)
  .where(and(eq(orders.paymentStatus, 'Verified'), sql`created_at >= ${thirtyDaysAgo}`))
  .groupBy(sql`DATE(created_at)`)
  .orderBy(sql`DATE(created_at)`);

  res.json(sales);
});

app.post('/api/dashboard/products', requireDashboardAuth, async (req, res) => {
  try {
    const data = sanitizeProductData(req.body);
    const result = await db.insert(products).values(data).returning();
    res.json(result[0]);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product. Please check your data.' });
  }
});

app.put('/api/dashboard/products/:id', requireDashboardAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });
  try {
    const data = sanitizeProductData(req.body);
    const result = await db.update(products).set(data).where(eq(products.id, id)).returning();
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/dashboard/products/all', requireDashboardAuth, async (req, res) => {
  try {
    await db.delete(products);
    res.json({ success: true, message: 'All products deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting all products:', error);
    res.status(500).json({ error: 'Failed to delete all products', details: error.message });
  }
});

app.delete('/api/dashboard/products/:id', requireDashboardAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });

  try {
    // Check if product exists first
    const productExists = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (productExists.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Try to delete. Wishlists will cascade, Orders will set null for productId.
    await db.delete(products).where(eq(products.id, id));
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error(`Detailed error deleting product ${id}:`, error);
    res.json({ 
      error: 'Failed to delete product', 
      details: error.message || 'Database constraint error'
    });
  }
});

app.post('/api/dashboard/products/bulk-visibility', requireDashboardAuth, async (req, res) => {
  const { ids, isPublished } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Product IDs required' });
  }

  try {
    await db.update(products)
      .set({ isPublished })
      .where(inArray(products.id, ids));
    res.json({ success: true });
  } catch (error) {
    console.error('Bulk visibility error:', error);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
});

app.post('/api/dashboard/products/visibility-all', requireDashboardAuth, async (req, res) => {
  const { isPublished } = req.body;
  try {
    await db.update(products).set({ isPublished });
    res.json({ success: true });
  } catch (error) {
    console.error('Visibility all error:', error);
    res.status(500).json({ error: 'Failed to update all products' });
  }
});

// --- AI Auto-Fill from Flipkart / E-Commerce URL ---
app.post('/api/dashboard/products/ai-extract-url', requireDashboardAuth, async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'Please enter a valid product URL' });
  }

  const cleanUrl = url.trim();

  try {
    // Extract readable slug / product tokens from URL
    let extractedSlugKeywords = '';
    try {
      const parsedUrl = new URL(cleanUrl);
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      // In flipkart: /product-name-slug/p/itm... or /dl/product-name/...
      const candidate = pathParts.find(p => p.length > 5 && p !== 'product' && p !== 'itm' && !p.startsWith('itm') && p !== 'dl') || '';
      extractedSlugKeywords = decodeURIComponent(candidate).replace(/[-_+]/g, ' ').trim();
    } catch {}

    // 1. Attempt lightweight web page scrape
    let pageSnippet = '';
    let scrapedImages: string[] = [];
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      try {
        const fetchRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(4000)
        });
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
          const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
          const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
          
          if (ogImage?.[1] && ogImage[1].startsWith('http')) {
            scrapedImages.push(ogImage[1]);
          }

          // Search for Flipkart CDN image links
          const cdnImgMatches = html.matchAll(/https:\/\/rukminim[12]\.flixcart\.com\/image\/[0-9]+\/[0-9]+\/[^"'\s\)]+/g);
          for (const m of cdnImgMatches) {
            if (m[0] && !scrapedImages.includes(m[0])) {
              scrapedImages.push(m[0]);
              if (scrapedImages.length >= 6) break;
            }
          }

          const cleanBody = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 3000);

          pageSnippet = `Title: ${ogTitle?.[1] || titleMatch?.[1] || ''}\nDescription: ${ogDesc?.[1] || ''}\nOgImage: ${ogImage?.[1] || ''}\nScrapedImages: ${scrapedImages.join(', ')}\nContent: ${cleanBody}`;
        }
      } catch {
        // Page fetch timeout or blocked, Gemini will parse URL slug directly
      }
    }

    // 2. Query Gemini
    const systemPrompt = `You are an expert e-commerce catalog AI specialist for Fancy Bazaar in India.
Your task is to scan and extract complete, accurate, high quality product details from this e-commerce URL (Flipkart, Amazon, Meesho, etc.):
URL: ${cleanUrl}
${extractedSlugKeywords ? `Product Slug / Model Name from URL: "${extractedSlugKeywords}"` : ''}
${pageSnippet ? `Scraped Context:\n${pageSnippet}` : ''}

Available categories in our store:
['Smart Watch', 'Android Smart Watch', 'Sarees', 'Kurtis & Suits', 'Beauty', 'Home Decor', 'MEN Fashion', 'Kids', 'Kitchen', 'Jewellery', 'Bag & Accessories', 'Innerwear', 'Footwear', 'Healthcare', 'Lehengas & Blouses', 'Case & Cover', 'Furniture', 'Sports & Fitness', 'General']

Return a strict, valid JSON object with the following fields:
{
  "name": "Full clean product title (e.g. Fire-Boltt Ninja Calling Pro Plus 1.83 inch Display Smartwatch)",
  "description": "Rich product description highlighting top features, design, and benefits (3-5 sentences)",
  "originalPrice": 4999,
  "sellingPrice": 1499,
  "category": "Smart Watch",
  "colors": ["Black", "Blue", "Orange"],
  "sizes": ["Free Size", "49mm"],
  "isReturnable": true,
  "badge": "Bestseller",
  "stock": 10,
  "imageUrl": "https://images.unsplash.com/photo-1546868871-704132a5d098?q=80&w=800",
  "images": [
    "https://images.unsplash.com/photo-1546868871-704132a5d098?q=80&w=800",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800",
    "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800"
  ],
  "specifications": {
    "General & Design": { "Model Name": "...", "Dial Shape": "...", "Strap Material": "..." },
    "Display & Screen": { "Display Size": "...", "Resolution": "..." },
    "Battery & Charging": { "Battery Life": "...", "Charging Time": "..." },
    "Connectivity & Network": { "Bluetooth Version": "...", "Calling Function": "..." },
    "Sensors & Health": { "Heart Rate": "...", "SpO2": "..." },
    "In The Box & Warranty": { "In The Box": "...", "Warranty Summary": "1 Year Manufacturer Warranty" }
  }
}

Important Instructions:
- "originalPrice" (MRP) should be a realistic Indian Rupee number.
- "sellingPrice" should be a realistic offer price (lower than MRP).
- "images" should contain 2 to 5 high resolution image URLs so customers can slide through all images. If you have scraped Flipkart CDN images or og:image, prioritize those! Otherwise provide realistic high-quality Unsplash image URLs fitting the product category.
- "specifications" should organize technical details into standard sections.
Return ONLY valid JSON. No markdown code blocks.`;

    const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    let extractedProduct: any = null;

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
        const text = response.text?.trim();
        if (text) {
          const cleanJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
          extractedProduct = JSON.parse(cleanJson);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${model} extraction attempt error:`, err.message);
        lastError = err;
      }
    }

    if (!extractedProduct) {
      throw lastError || new Error('Could not extract product details');
    }

    // Merge any real scraped images from Flipkart
    if (scrapedImages.length > 0) {
      const existing = Array.isArray(extractedProduct.images) ? extractedProduct.images : [];
      extractedProduct.images = Array.from(new Set([...scrapedImages, ...existing]));
      extractedProduct.imageUrl = scrapedImages[0] || extractedProduct.imageUrl;
    }

    // Fallback images if images is empty or has fewer than 2 images
    if (!Array.isArray(extractedProduct.images) || extractedProduct.images.length < 2) {
      const defaultImg = extractedProduct.imageUrl || (Array.isArray(extractedProduct.images) && extractedProduct.images[0]) || 'https://images.unsplash.com/photo-1546868871-704132a5d098?q=80&w=800';
      const existingImgs = Array.isArray(extractedProduct.images) ? extractedProduct.images : [defaultImg];
      extractedProduct.images = Array.from(new Set([
        ...existingImgs,
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800',
        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800'
      ]));
      extractedProduct.imageUrl = extractedProduct.images[0];
    }

    res.json({ success: true, product: extractedProduct });
  } catch (error: any) {
    console.error('AI extract product error:', error);
    res.status(500).json({ error: error.message || 'Failed to scan and extract product details with AI' });
  }
});


// Banners Management
app.get('/api/dashboard/banners', requireDashboardAuth, async (req, res) => {
  const result = await db.select().from(banners).orderBy(banners.sortOrder);
  res.json(result);
});

// Coupons Management
app.get('/api/dashboard/coupons', requireDashboardAuth, async (req, res) => {
  const result = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  res.json(result);
});

app.post('/api/dashboard/coupons', requireDashboardAuth, async (req, res) => {
  const data = req.body;
  if (data.code) data.code = data.code.toUpperCase();
  delete data.id;
  delete data.createdAt;
  const result = await db.insert(coupons).values(data).returning();
  res.json(result[0]);
});

app.put('/api/dashboard/coupons/:id', requireDashboardAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid coupon ID' });
  const data = req.body;
  if (data.code) data.code = data.code.toUpperCase();
  delete data.id;
  delete data.createdAt;
  await db.update(coupons).set(data).where(eq(coupons.id, id));
  res.json({ success: true });
});

app.delete('/api/dashboard/coupons/:id', requireDashboardAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid coupon ID' });
  try {
    const couponExists = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    if (couponExists.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    await db.delete(coupons).where(eq(coupons.id, id));
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting coupon ${id}:`, error);
    res.status(500).json({ 
      error: 'Failed to delete coupon', 
      details: error.message || 'Unknown error'
    });
  }
});

app.post('/api/dashboard/banners', requireDashboardAuth, async (req, res) => {
  const data = { ...req.body };
  delete data.id;
  delete data.createdAt;
  const result = await db.insert(banners).values(data).returning();
  res.json(result[0]);
});

app.put('/api/dashboard/banners/:id', requireDashboardAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid banner ID' });
  const data = req.body;
  delete data.id;
  delete data.createdAt;
  await db.update(banners).set(data).where(eq(banners.id, id));
  res.json({ success: true });
});

app.delete('/api/dashboard/banners/:id', requireDashboardAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid banner ID' });

  try {
    const bannerExists = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
    if (bannerExists.length === 0) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    await db.delete(banners).where(eq(banners.id, id));
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting banner ${id}:`, error);
    res.status(500).json({ 
      error: 'Failed to delete banner', 
      details: error.message || 'Unknown error'
    });
  }
});

// Settings Management
app.get('/api/dashboard/settings', requireDashboardAuth, async (req, res) => {
  const upi = await getSetting('upi_settings');
  const gen = await getSetting('general_settings');
  const customerAwards = await getSetting('customer_awards');
  const bogo = await getSetting('bogo_campaign');
  res.json({ upi, general: gen, customerAwards, bogoCampaign: bogo });
});

app.put('/api/dashboard/settings/:key', requireDashboardAuth, async (req, res) => {
  await updateSetting(req.params.key, req.body);
  res.json({ success: true });
});

app.put('/api/dashboard/settings/password', requireDashboardAuth, async (req, res) => {
  const { newPassword } = req.body;
  const hash = crypto.createHash('sha256').update(newPassword).digest('hex');
  await updateSetting('admin_password', { hash });
  res.json({ success: true });
});

// --- Public & Dashboard BOGO Flash Offer Campaign API ---
app.get('/api/bogo-campaign', async (req, res) => {
  try {
    const defaultCampaign = {
      enabled: false,
      startDate: new Date().toISOString().split('T')[0],
      startTime: '00:00',
      endDate: new Date().toISOString().split('T')[0],
      endTime: '23:59',
      bannerText: 'BUY 1 GET 1 FREE FLASH OFFER ON ALL PRODUCTS!'
    };
    const saved = await getSetting('bogo_campaign') as any;
    const campaign = { ...defaultCampaign, ...(saved || {}) };

    const now = new Date();
    let isActive = false;
    let hasEnded = false;
    let startTimestamp = 0;
    let endTimestamp = 0;

    if (campaign.startDate && campaign.startTime && campaign.endDate && campaign.endTime) {
      const start = new Date(`${campaign.startDate}T${campaign.startTime}:00`);
      const end = new Date(`${campaign.endDate}T${campaign.endTime}:00`);
      startTimestamp = start.getTime();
      endTimestamp = end.getTime();
      const nowMs = now.getTime();

      if (campaign.enabled) {
        if (nowMs >= startTimestamp && nowMs < endTimestamp) {
          isActive = true;
        } else if (nowMs >= endTimestamp) {
          hasEnded = true;
        }
      }
    }

    res.json({
      ...campaign,
      isActive,
      hasEnded,
      serverTime: now.toISOString(),
      startTimestamp,
      endTimestamp,
      remainingSeconds: isActive ? Math.max(0, Math.floor((endTimestamp - now.getTime()) / 1000)) : 0
    });
  } catch (err) {
    console.error('BOGO campaign fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch BOGO campaign status' });
  }
});

app.put('/api/dashboard/bogo-campaign', requireDashboardAuth, async (req, res) => {
  try {
    const { enabled, startDate, startTime, endDate, endTime, bannerText } = req.body;
    const newConfig = {
      enabled: Boolean(enabled),
      startDate: startDate || new Date().toISOString().split('T')[0],
      startTime: startTime || '00:00',
      endDate: endDate || new Date().toISOString().split('T')[0],
      endTime: endTime || '23:59',
      bannerText: bannerText || 'BUY 1 GET 1 FREE FLASH OFFER ON ALL PRODUCTS!'
    };
    await updateSetting('bogo_campaign', newConfig);
    res.json({ success: true, campaign: newConfig });
  } catch (err: any) {
    console.error('Save BOGO campaign error:', err);
    res.status(500).json({ error: 'Failed to save campaign settings' });
  }
});

// --- 404 Handler for API ---
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// --- Server & Frontend ---

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await import('vite');
  const viteServer = await vite.createServer({
    server: { 
      middlewareMode: true,
      hmr: false
    },
    appType: 'custom'
  });
  app.use(viteServer.middlewares);
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const templatePath = path.resolve(__dirname, 'index.html');
      const fs = await import('fs');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      let template = await viteServer.transformIndexHtml(url, templateContent);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      viteServer.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    error: 'An internal server error occurred',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (0.0.0.0)`);
});
