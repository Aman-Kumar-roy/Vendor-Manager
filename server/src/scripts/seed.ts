import bcrypt from 'bcrypt';
import { connectMongoDB } from '../config/db';
import { UserModel } from '../models/User';
import { SellerModel } from '../models/Seller';
import { TransactionModel } from '../models/Transaction';

async function seedDatabase() {
  await connectMongoDB();

  console.log('🌱 Seeding initial MongoDB data...');

  // Default Admin Accounts
  const adminEmails = ['admin@webkul.com', 'admin@example.com'];
  const hashedPassword = await bcrypt.hash('admin123', 10);

  for (const email of adminEmails) {
    const existingAdmin = await UserModel.findOne({ email });
    if (!existingAdmin) {
      await UserModel.create({
        email,
        password: hashedPassword,
        name: 'System Administrator',
        role: 'admin',
      });
      console.log(`✅ Default admin account created: ${email} / admin123`);
    } else {
      // Ensure password is updated to admin123
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log(`ℹ️ Admin account updated: ${email} / admin123`);
    }
  }

  // Seed Demo Sellers if collection is empty
  const sellerCount = await SellerModel.countDocuments();
  if (sellerCount === 0) {
    const seller1 = await SellerModel.create({
      name: 'Apex Aqua Solutions',
      email: 'contact@apexaqua.com',
      phone: '+91 98765 43210',
      address: 'Plot 42, Industrial Zone, New Delhi',
      gstNumber: '07AAAAA0000A1Z5',
    });

    const seller2 = await SellerModel.create({
      name: 'Metro Water Suppliers',
      email: 'info@metrowater.com',
      phone: '+91 91234 56789',
      address: 'Building 5, Ring Road, Gurgaon',
      gstNumber: '07BBBBB1111B2Z6',
    });

    console.log('✅ Demo sellers seeded: Apex Aqua Solutions, Metro Water Suppliers');

    // Seed Demo Transactions
    await TransactionModel.create([
      {
        sellerId: seller1._id,
        type: 'DELIVERY',
        amount: 25000,
        note: 'Initial supply of 1000L and 2000L tanks',
        tank500: 0,
        tank1000: 10,
        tank2000: 5,
        date: new Date('2026-08-10'),
      },
      {
        sellerId: seller1._id,
        type: 'PAYMENT',
        amount: 15000,
        paymentMode: 'UPI',
        note: 'Partial payment received via UPI',
        date: new Date('2026-08-12'),
      },
      {
        sellerId: seller2._id,
        type: 'DELIVERY',
        amount: 18000,
        note: 'Supply of 500L and 1000L tanks',
        tank500: 12,
        tank1000: 6,
        tank2000: 0,
        date: new Date('2026-08-15'),
      },
    ]);

    console.log('✅ Initial demo delivery and payment transactions seeded.');
  } else {
    console.log('ℹ️ Sellers collection already populated.');
  }

  console.log('🎉 Seeding completed successfully!');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
