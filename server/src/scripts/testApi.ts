import http from 'http';
import { connectMongoDB } from '../config/db';
import app from '../app';
import { env } from '../config/env';

// Comprehensive API Test Runner for Vasudha Polymer VTMS (Web & Mobile API)
async function runApiTests() {
  console.log('🧪 Starting Vasudha Polymer VTMS API Verification Test Suite...\n');

  await connectMongoDB();

  // Create an in-process test server on an ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const BASE_URL = `http://localhost:${address.port}/api/v1`;
  const HEALTH_URL = `http://localhost:${address.port}/health`;

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      process.stdout.write(`  ▶ ${name}... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err: any) {
      console.log('❌ FAIL');
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  let authToken = '';
  let testSellerId = '';

  try {
    // 1. Health Check
    await test('GET /health (Server Healthcheck)', async () => {
      const res = await fetch(HEALTH_URL);
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const data = await res.json() as any;
      assert(data.status === 'OK', `Expected status 'OK', got ${data.status}`);
    });

    // 2. Auth Login
    await test('POST /api/v1/auth/login (Admin Credentials)', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@webkul.com',
          password: 'admin123',
        }),
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(Boolean(body.data?.token), 'Expected token in response');
      assert(Boolean(body.data?.user), 'Expected user in response');
      authToken = body.data.token;
    });

    // 3. Auth Me
    await test('GET /api/v1/auth/me (Verify JWT Authentication)', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(Boolean(body.data?.user?.email), 'Expected user object');
    });

    // 3a. Create User
    let newUserId = '';
    const testUserEmail = `testuser_${Date.now()}@example.com`;
    const testUserPassword = 'password123';
    await test('POST /api/v1/auth/users (Create User with Credentials)', async () => {
      const res = await fetch(`${BASE_URL}/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'Operations Manager',
          email: testUserEmail,
          password: testUserPassword,
          role: 'manager',
        }),
      });
      assert(res.status === 201, `Expected status 201, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(Boolean(body.data?.user?.id), 'Expected created user id');
      assert(body.data.user.email === testUserEmail, 'Expected matching email');
      newUserId = body.data.user.id;
    });

    // 3b. List Users
    await test('GET /api/v1/auth/users (List Users)', async () => {
      const res = await fetch(`${BASE_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(Array.isArray(body.data?.users), 'Expected users array');
      const found = body.data.users.some((u: any) => u.id === newUserId);
      assert(found, 'Expected newly created user in users list');
    });

    // 3c. Login with Newly Created User Credentials
    let managerToken = '';
    await test('POST /api/v1/auth/login (Verify Login with Newly Created User Credentials)', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
        }),
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected login success === true');
      assert(Boolean(body.data?.token), 'Expected token for newly created user');
      assert(body.data?.user?.email === testUserEmail, 'Expected matching user email');
      managerToken = body.data?.token;
    });

    // 3d. Verify Non-Admin (Manager) is Denied Deleting Users (403 Forbidden)
    await test('DELETE /api/v1/auth/users/:id (Non-Admin Blocked with 403 Forbidden)', async () => {
      const res = await fetch(`${BASE_URL}/auth/users/${newUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      assert(res.status === 403, `Expected status 403 for non-admin user deletion, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === false, 'Expected success === false');
    });

    // 3e. Admin Permitted to Delete Test User Cleanup
    await test('DELETE /api/v1/auth/users/:id (Admin Permitted User Cleanup)', async () => {
      const res = await fetch(`${BASE_URL}/auth/users/${newUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected delete success === true');
    });

    // 4. Get Sellers List
    await test('GET /api/v1/sellers (Sellers List & Summary Calculations)', async () => {
      const res = await fetch(`${BASE_URL}/sellers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(Array.isArray(body.data?.sellers), 'Expected sellers array in data');
      assert(Boolean(body.data?.summary), 'Expected summary metrics in data');
      assert(typeof body.data.summary.totalTank500 === 'number', 'Expected summary.totalTank500');
      assert(typeof body.data.summary.totalTank1000 === 'number', 'Expected summary.totalTank1000');
      assert(typeof body.data.summary.totalTank2000 === 'number', 'Expected summary.totalTank2000');
      assert(typeof body.data.summary.totalTanks === 'number', 'Expected summary.totalTanks');
      if (body.data.sellers.length > 0) {
        testSellerId = body.data.sellers[0].id;
      }
    });

    // 5. Create Seller (Toggle ON by default - Full validation)
    await test('POST /api/v1/sellers (Toggle ON rejects missing email or GST)', async () => {
      const res = await fetch(`${BASE_URL}/sellers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: 'Missing Fields Vendor',
          // requireAdditional defaults to true
        }),
      });
      assert(res.status === 400, `Expected status 400 for missing required fields on toggle ON, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === false, 'Expected success === false');
      assert(Boolean(body.error || body.message), 'Expected error or message property');
    });

    await test('POST /api/v1/sellers (Toggle OFF permits creation with Name only)', async () => {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const res = await fetch(`${BASE_URL}/sellers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: `Minimal Vendor ${uniqueSuffix}`,
          requireAdditional: false,
        }),
      });
      assert(res.status === 201, `Expected status 201 for toggle OFF with name only, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(body.message === 'Seller created successfully.', 'Expected success message');
      assert(Boolean(body.seller?.id || body.data?.id), 'Expected seller in response');
    });

    await test('POST /api/v1/sellers (Create Vendor with Toggle ON & Full Fields)', async () => {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const res = await fetch(`${BASE_URL}/sellers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: `Test Vendor ${uniqueSuffix}`,
          email: `vendor${uniqueSuffix}@test.com`,
          phone: '+91 99999 11111',
          address: 'Test Industrial Area, Sector 5',
          gstNumber: `07TEST${uniqueSuffix}Z1`,
          requireAdditional: true,
        }),
      });
      assert(res.status === 201 || res.status === 200, `Expected status 201/200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(body.message === 'Seller created successfully.', 'Expected success message');
      assert(Boolean(body.seller?.id || body.data?.seller?.id || body.data?.id), 'Expected seller in response');
      if (!testSellerId && (body.seller?.id || body.data?.seller?.id || body.data?.id)) {
        testSellerId = body.seller?.id || body.data?.seller?.id || body.data?.id;
      }
    });

    // 6. Get Seller By ID
    if (testSellerId) {
      await test(`GET /api/v1/sellers/:id (Vendor Details & Transactions)`, async () => {
        const res = await fetch(`${BASE_URL}/sellers/${testSellerId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        assert(res.status === 200, `Expected status 200, got ${res.status}`);
        const body = await res.json() as any;
        assert(body.success === true, 'Expected success === true');
        assert(Boolean(body.data?.seller), 'Expected seller object inside data.seller');
        assert(Array.isArray(body.data.seller.transactions), 'Expected transactions array');
        assert(typeof body.data.seller.tank500 === 'number', 'Expected tank500 number');
        assert(typeof body.data.seller.tank1000 === 'number', 'Expected tank1000 number');
        assert(typeof body.data.seller.tank2000 === 'number', 'Expected tank2000 number');
        assert(typeof body.data.seller.totalTanks === 'number', 'Expected totalTanks number');
      });
    }

    // 7. Post Delivery Transaction (Strict 500/1000/2000 tank capacities)
    if (testSellerId) {
      await test('POST /api/v1/transactions (Delivery with tank500, tank1000, tank2000)', async () => {
        const res = await fetch(`${BASE_URL}/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            sellerId: testSellerId,
            type: 'DELIVERY',
            amount: 15000,
            date: new Date().toISOString().split('T')[0],
            tank500: 5,
            tank1000: 3,
            tank2000: 1,
            note: 'Standard water tank delivery order',
          }),
        });
        assert(res.status === 201 || res.status === 200, `Expected status 201/200, got ${res.status}`);
        const body = await res.json() as any;
        assert(body.success === true, 'Expected success === true');
        assert(body.message === 'Transaction created successfully.', 'Expected transaction success message');
        assert(Boolean(body.receipt?.receiptNo || body.data?.receipt?.receiptNo), 'Expected receipt in response');
        const txId = body.transaction?._id || body.transaction?.id || body.data?.transaction?.id;

        if (txId) {
          // Verify Receipt Voucher Endpoint
          const receiptRes = await fetch(`${BASE_URL}/transactions/${txId}/receipt`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          assert(receiptRes.status === 200, `Expected status 200 for receipt voucher, got ${receiptRes.status}`);
          const receiptBody = await receiptRes.json() as any;
          assert(receiptBody.success === true, 'Expected receiptBody.success === true');
          assert(Boolean(receiptBody.data?.receiptNo), 'Expected receiptNo in voucher data');
          assert(Boolean(receiptBody.data?.pdfUrl || receiptBody.receiptUrl), 'Expected pdfUrl in receipt response');

          // Verify Server-Generated Canonical PDF Endpoint
          const pdfRes = await fetch(`${BASE_URL}/transactions/${txId}/receipt/pdf`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          assert(pdfRes.status === 200, `Expected status 200 for receipt PDF, got ${pdfRes.status}`);
          assert(Boolean(pdfRes.headers.get('content-type')?.includes('application/pdf')), 'Expected application/pdf content type');
          const pdfBuffer = await pdfRes.arrayBuffer();
          assert(pdfBuffer.byteLength > 1000, `Expected valid PDF buffer (>1000 bytes), got ${pdfBuffer.byteLength}`);
          const pdfMagicBytes = Buffer.from(pdfBuffer.slice(0, 5)).toString();
          assert(pdfMagicBytes === '%PDF-', `Expected PDF header %PDF-, got ${pdfMagicBytes}`);

          // Verify Query Parameter Token Support (for browser tab open & mobile download)
          const pdfTokenRes = await fetch(`${BASE_URL}/transactions/${txId}/receipt/pdf?token=${authToken}`);
          assert(pdfTokenRes.status === 200, `Expected status 200 for token query param PDF, got ${pdfTokenRes.status}`);
        }
      });

      // 8. Post Payment Settlement Transaction
      await test('POST /api/v1/transactions (Payment Settlement)', async () => {
        const res = await fetch(`${BASE_URL}/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            sellerId: testSellerId,
            type: 'PAYMENT',
            amount: 5000,
            date: new Date().toISOString().split('T')[0],
            paymentMode: 'UPI',
            note: 'Advance installment settlement',
          }),
        });
        assert(res.status === 201 || res.status === 200, `Expected status 201/200, got ${res.status}`);
        const body = await res.json() as any;
        assert(body.success === true, 'Expected success === true');
      });
    }

    // 9. Get Transactions List
    await test('GET /api/v1/transactions (Transaction Ledger)', async () => {
      const res = await fetch(`${BASE_URL}/transactions`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(Array.isArray(body.data?.transactions), 'Expected transactions array');
    });

    // 9b. Get Paginated Transactions (Receipts Center API)
    await test('GET /api/v1/transactions?page=1&limit=5 (Paginated Receipts API)', async () => {
      const res = await fetch(`${BASE_URL}/transactions?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(Array.isArray(body.data?.transactions), 'Expected transactions array');
      assert(Boolean(body.data?.pagination), 'Expected pagination metadata');
      assert(body.data.pagination.page === 1, 'Expected page === 1');
      assert(body.data.pagination.limit === 5, 'Expected limit === 5');
      assert(typeof body.data.pagination.total === 'number', 'Expected total number');
    });

    // 10. Reports Summary
    await test('GET /api/v1/reports/summary (High-level financial & tank totals)', async () => {
      const res = await fetch(`${BASE_URL}/reports/summary`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(Boolean(body.data?.metrics), 'Expected metrics');
      assert(Boolean(body.data?.tankBreakdown), 'Expected tankBreakdown');
    });

    // 11. Reports Tank Summary (Monthly per seller)
    await test('GET /api/v1/reports/tank-summary (Monthly tank analytics per vendor)', async () => {
      const ym = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`${BASE_URL}/reports/tank-summary?month=${ym}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(Array.isArray(body.data?.summary), 'Expected summary array');
    });

    // 12. Reports Tank Summary (Date Range live analytics)
    await test('GET /api/v1/reports/tank-summary (Date range live analytics)', async () => {
      const start = '2026-01-01';
      const end = '2026-12-31';
      const res = await fetch(`${BASE_URL}/reports/tank-summary?startDate=${start}&endDate=${end}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert(res.status === 200, `Expected status 200, got ${res.status}`);
      const body = await res.json() as any;
      assert(body.success === true, 'Expected success === true');
      assert(Array.isArray(body.data?.summary), 'Expected summary array');
      assert(Boolean(body.data?.startDate), 'Expected startDate in response');
      assert(Boolean(body.data?.endDate), 'Expected endDate in response');
    });

  } finally {
    server.close();
  }

  console.log(`\n📊 API Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All API endpoints verified successfully for both Web and Mobile apps!\n');
    process.exit(0);
  }
}

runApiTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
