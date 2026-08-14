import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { query, initDatabase } from '../utils/db';

async function seed() {
  console.log('🌱 Starting database seed with Native MySQL queries...');

  // Ensure tables exist
  await initDatabase();

  // 1. Upsert Admin User
  const adminEmail = 'admin@example.com';
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const existingAdmins = await query<any[]>('SELECT id FROM User WHERE email = ? LIMIT 1', [adminEmail]);

  if (existingAdmins && existingAdmins.length > 0) {
    await query('UPDATE User SET password = ?, name = ? WHERE email = ?', [
      hashedPassword,
      'System Admin',
      adminEmail,
    ]);
  } else {
    await query('INSERT INTO User (id, email, password, name) VALUES (?, ?, ?, ?)', [
      randomUUID(),
      adminEmail,
      hashedPassword,
      'System Admin',
    ]);
  }

  console.log(`✅ Admin user seeded: ${adminEmail} (Password: admin123)`);

  // 2. Clear existing transactions and sellers
  await query('DELETE FROM Transaction');
  await query('DELETE FROM Seller');

  // 3. Define 12 Rich Dummy Seller Profiles for pagination testing
  const dummySellers = [
    {
      name: 'Apex Logistics & Freight Supplies',
      email: 'billing@apexlogistics.com',
      phone: '+1 (555) 234-5678',
      address: '100 Industrial Parkway, Suite 400, Chicago, IL',
      transactions: [
        { key: 'apex-1', type: 'DELIVERY', amount: 8500.00, date: '2026-07-15T09:00:00Z', note: 'Q3 Heavy Industrial Haulage Batch #A101' },
        { key: 'apex-2', type: 'DELIVERY', amount: 4200.50, date: '2026-07-22T14:30:00Z', note: 'Warehouse Spare Parts Dispatch #A108' },
        { type: 'PAYMENT', parentKey: 'apex-1', amount: 6000.00, date: '2026-07-28T16:00:00Z', note: 'ACH Wire Payment ref #WT-88392' },
        { key: 'apex-3', type: 'DELIVERY', amount: 3100.00, date: '2026-08-02T10:15:00Z', note: 'Interstate Transport Delivery #A115' },
        { type: 'PAYMENT', parentKey: 'apex-2', amount: 4200.50, date: '2026-08-03T13:00:00Z', note: 'Invoice Settlement for Warehouse Shipment' },
        { type: 'PAYMENT', parentKey: 'apex-3', amount: 1500.00, date: '2026-08-06T11:00:00Z', note: 'Partial Payment ref #BS-49102' },
      ],
    },
    {
      name: 'Global Fresh Farm Goods Co.',
      email: 'accounts@globalfresh.org',
      phone: '+1 (555) 876-5432',
      address: '45 Harvest Way, Portland, OR',
      transactions: [
        { key: 'fresh-1', type: 'DELIVERY', amount: 3450.75, date: '2026-08-01T08:30:00Z', note: 'Cold-Storage Organic Produce Crate #C409' },
        { type: 'PAYMENT', parentKey: 'fresh-1', amount: 3450.75, date: '2026-08-04T12:00:00Z', note: 'Full Invoice Settlement via Check #8812' },
      ],
    },
    {
      name: 'Vanguard Micro-Electronics Ltd.',
      email: 'sales@vanguardelec.io',
      phone: '+1 (555) 345-6789',
      address: '78 Tech Boulevard, Austin, TX',
      transactions: [
        { key: 'vanguard-1', type: 'DELIVERY', amount: 15800.00, date: '2026-07-10T10:00:00Z', note: 'IoT Sensor Chips & Microcontrollers Batch #1' },
        { type: 'PAYMENT', parentKey: 'vanguard-1', amount: 8000.00, date: '2026-07-20T15:00:00Z', note: 'Milestone 1 Payment ref #PAY-551' },
        { key: 'vanguard-2', type: 'DELIVERY', amount: 6400.00, date: '2026-07-30T11:45:00Z', note: 'Custom PCB Circuit Boards Shipment #2' },
        { type: 'PAYMENT', parentKey: 'vanguard-2', amount: 7000.00, date: '2026-08-06T14:20:00Z', note: 'Milestone 2 Payment ref #PAY-692' },
      ],
    },
    {
      name: 'Horizon Wholesale Packaging Supplies',
      email: 'support@horizonpack.com',
      phone: '+1 (555) 901-2345',
      address: '12 Commerce Ave, Atlanta, GA',
      transactions: [
        { key: 'horizon-1', type: 'DELIVERY', amount: 2800.00, date: '2026-08-03T13:00:00Z', note: 'Corrugated Boxes & Eco Wrap Material' },
        { type: 'PAYMENT', parentKey: 'horizon-1', amount: 3500.00, date: '2026-08-07T10:00:00Z', note: 'Advance Deposit Settlement (Overpaid Balance)' },
      ],
    },
    {
      name: 'Titan Polymer & Rubber Corp',
      email: 'orders@titanpolymer.com',
      phone: '+1 (555) 432-1098',
      address: '500 Petrochemical Way, Houston, TX',
      transactions: [
        { key: 'titan-1', type: 'DELIVERY', amount: 12500.00, date: '2026-07-18T14:00:00Z', note: 'Raw High-Density Polyethylene Resin Containers' },
        { key: 'titan-2', type: 'DELIVERY', amount: 4800.00, date: '2026-08-04T09:30:00Z', note: 'Vulcanized Rubber Seals & Gaskets Batch' },
        { type: 'PAYMENT', parentKey: 'titan-1', amount: 5000.00, date: '2026-07-25T16:30:00Z', note: 'Partial Advance Payment ref #ACH-109' },
      ],
    },
    {
      name: 'Starlight Paper & Print Solutions',
      email: 'info@starlightpaper.net',
      phone: '+1 (555) 678-9012',
      address: '220 Press Road, Philadelphia, PA',
      transactions: [
        { key: 'starlight-1', type: 'DELIVERY', amount: 1950.00, date: '2026-07-29T11:00:00Z', note: 'Heavyweight Matte Packaging Stock Shipment' },
        { type: 'PAYMENT', parentKey: 'starlight-1', amount: 1950.00, date: '2026-08-02T15:15:00Z', note: 'Full Electronic Funds Transfer #EFT-332' },
      ],
    },
    {
      name: 'Nexus Chemical Refineries',
      email: 'finance@nexuschem.com',
      phone: '+1 (555) 789-0123',
      address: '90 Harbor Drive, Wilmington, DE',
      transactions: [
        { key: 'nexus-1', type: 'DELIVERY', amount: 22000.00, date: '2026-07-05T08:00:00Z', note: 'Industrial Cleaning Solvents (Bulk Drums)' },
        { type: 'PAYMENT', parentKey: 'nexus-1', amount: 12000.00, date: '2026-07-19T10:30:00Z', note: 'Installment 1 Payment ref #WIRE-9921' },
        { type: 'PAYMENT', parentKey: 'nexus-1', amount: 10000.00, date: '2026-08-01T16:45:00Z', note: 'Final Account Settlement #WIRE-9982' },
      ],
    },
    {
      name: 'Summit Hardware & Fasteners',
      email: 'sales@summithardware.com',
      phone: '+1 (555) 890-1234',
      address: '88 Industrial Blvd, Denver, CO',
      transactions: [
        { key: 'summit-1', type: 'DELIVERY', amount: 5600.25, date: '2026-08-01T12:00:00Z', note: 'Stainless Steel Fasteners & Bolts Supply' },
        { type: 'PAYMENT', parentKey: 'summit-1', amount: 2500.00, date: '2026-08-06T14:00:00Z', note: 'Partial Check Deposit #CHK-5501' },
      ],
    },
    {
      name: 'Crescent Textile Traders',
      email: 'orders@crescenttextile.com',
      phone: '+1 (555) 312-7800',
      address: '12 Cotton Row, Charlotte, NC',
      transactions: [
        { key: 'crescent-1', type: 'DELIVERY', amount: 7200.00, date: '2026-07-07T10:15:00Z', note: 'Premium Fabric Roll Shipment #T004' },
        { key: 'crescent-2', type: 'DELIVERY', amount: 2950.00, date: '2026-07-18T09:45:00Z', note: 'Silk Blend Textile Order #T006' },
        { type: 'PAYMENT', parentKey: 'crescent-1', amount: 3600.00, date: '2026-07-20T13:00:00Z', note: 'First Half Payment ref #TX-2201' },
      ],
    },
    {
      name: 'Beacon Industrial Hardware',
      email: 'supply@beaconind.com',
      phone: '+1 (555) 671-1524',
      address: '333 Ironworks Lane, Cleveland, OH',
      transactions: [
        { key: 'beacon-1', type: 'DELIVERY', amount: 11250.00, date: '2026-07-25T14:00:00Z', note: 'Heavy Machinery Fasteners & Mounts' },
        { key: 'beacon-2', type: 'DELIVERY', amount: 4800.00, date: '2026-08-03T11:30:00Z', note: 'Industrial Grade Bolts Refill' },
        { type: 'PAYMENT', parentKey: 'beacon-1', amount: 5000.00, date: '2026-08-05T09:15:00Z', note: 'Bank Transfer ref #MG-442' },
      ],
    },
    {
      // Seller 11 — for pagination testing (page 2+)
      name: 'Silverline Electrical Components',
      email: 'procurement@silverlineelec.com',
      phone: '+1 (555) 223-4456',
      address: '50 Volt Street, San Jose, CA',
      transactions: [
        { key: 'silver-1', type: 'DELIVERY', amount: 9300.00, date: '2026-07-12T09:00:00Z', note: 'High-Voltage Cable Assemblies Lot #E001' },
        { key: 'silver-2', type: 'DELIVERY', amount: 4100.00, date: '2026-07-28T11:00:00Z', note: 'Circuit Breakers & Junction Boxes #E007' },
        { type: 'PAYMENT', parentKey: 'silver-1', amount: 4000.00, date: '2026-08-01T10:00:00Z', note: 'Partial Wire Transfer #WT-1029' },
        { type: 'PAYMENT', parentKey: 'silver-2', amount: 4100.00, date: '2026-08-04T14:30:00Z', note: 'Full Payment Invoice #INV-2204' },
      ],
    },
    {
      // Seller 12 — for pagination testing (page 2+)
      name: 'Prairie Grain & Agri Commodities',
      email: 'accounts@prairiegrain.com',
      phone: '+1 (555) 556-8899',
      address: '7 Silo Drive, Omaha, NE',
      transactions: [
        { key: 'prairie-1', type: 'DELIVERY', amount: 6750.00, date: '2026-07-20T08:00:00Z', note: 'Bulk Wheat & Soybean Consignment #AG-301' },
        { key: 'prairie-2', type: 'DELIVERY', amount: 3200.00, date: '2026-08-05T09:00:00Z', note: 'Corn Batch Delivery #AG-318' },
        { type: 'PAYMENT', parentKey: 'prairie-1', amount: 6750.00, date: '2026-07-30T12:00:00Z', note: 'Full Settled via NEFT ref #NEFT-0042' },
      ],
    },
  ];

  for (const sData of dummySellers) {
    const sellerId = randomUUID();
    await query(
      'INSERT INTO Seller (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [sellerId, sData.name, sData.email, sData.phone, sData.address]
    );

    const transactionIds: Record<string, string> = {};
    for (const t of sData.transactions) {
      const txId = randomUUID();
      if ((t as any).key) {
        transactionIds[(t as any).key] = txId;
      }

      const parentId = (t as any).parentKey ? transactionIds[(t as any).parentKey] || null : null;
      await query(
        'INSERT INTO Transaction (id, sellerId, parentId, type, amount, date, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [txId, sellerId, parentId, t.type, t.amount, new Date(t.date), t.note]
      );
    }

    console.log(`✅ Seeded seller: ${sData.name} (${sData.transactions.length} transactions)`);
  }

  console.log(`\n🎉 Database seeding finished! ${dummySellers.length} sellers inserted into MySQL.`);
  console.log('   Use npm run db:seed to re-run anytime (clears existing sellers first).');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });
