// Live End-to-End API Verification Script
// Tests all 13 business and security scenarios against http://localhost:8080

const BASE_URL = 'http://localhost:8080';

async function run() {
  console.log('====================================================');
  console.log('  CampusShare Live End-to-End API Verification');
  console.log('====================================================');

  let passes = 0;
  let fails = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passes++;
    } else {
      console.error(`[FAIL] ${message}`);
      fails++;
    }
  }

  const timestamp = Date.now();
  const studentAEmail = `studentA_${timestamp}@campusshare.edu`;
  const studentBEmail = `studentB_${timestamp}@campusshare.edu`;

  // 1. Register student A, student B, and login seeded Admin
  console.log('\n--- 1. Registration & Authentication ---');
  let res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Student Alice',
      email: studentAEmail,
      password: 'Password123!',
      phone: '+91 9876543211',
      collegeId: '22BCSE001',
    }),
  });
  assert(res.status === 201, 'Student A registers successfully (HTTP 201)');
  const dataA = await res.json();
  const tokenA = dataA.token;

  res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Student Bob',
      email: studentBEmail,
      password: 'Password123!',
      phone: '+91 9876543212',
      collegeId: '22BCSE002',
    }),
  });
  assert(res.status === 201, 'Student B registers successfully (HTTP 201)');
  const dataB = await res.json();
  const tokenB = dataB.token;

  // Login Admin (seeded via AdminInitializer)
  res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@campusshare.edu',
      password: 'Admin@Campus2026!',
    }),
  });
  assert(res.status === 200, 'Admin logs in successfully (HTTP 200)');
  const dataAdmin = await res.json();
  const tokenAdmin = dataAdmin.token;
  assert(dataAdmin.user.role === 'ADMIN', 'Admin user has role ADMIN');

  // 2. Student A lists an item
  console.log('\n--- 2. Item Listing by Student A ---');
  res = await fetch(`${BASE_URL}/api/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      title: 'Casio Scientific Calculator fx-991EX',
      description: 'Used for engineering calculus exams',
      dailyPrice: 25.0,
      deposit: 150.0,
      condition: 'LIKE_NEW',
      categoryId: 1, // Calculators
      imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa',
      tags: ['Engineering', 'Calculus', 'Exam Ready'],
    }),
  });
  assert(res.status === 201, 'Student A creates item listing (HTTP 201)');
  const item = await res.json();
  const itemId = item.id;
  assert(item.title === 'Casio Scientific Calculator fx-991EX', 'Item title matches');
  assert(Number(item.dailyPrice) === 25, 'Daily price is ₹25.00');

  // Student A cannot rent their own item
  res = await fetch(`${BASE_URL}/api/rentals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      itemId,
      startDate: '2026-11-01',
      endDate: '2026-11-03',
    }),
  });
  assert(res.status === 400, 'Student A cannot rent their own item (HTTP 400)');

  // 3. Student B requests rental for 3 days
  console.log('\n--- 3. Student B Requests Rental ---');
  res = await fetch(`${BASE_URL}/api/rentals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      itemId,
      startDate: '2026-11-01',
      endDate: '2026-11-03', // 3 days inclusive: Nov 1, 2, 3
    }),
  });
  assert(res.status === 201, 'Student B submits rental request (HTTP 201)');
  const rental = await res.json();
  const rentalId = rental.id;
  assert(rental.totalDays === 3, 'Rental duration calculated as 3 days');
  assert(Number(rental.totalAmount) === 75, 'Rental amount calculated server-side as ₹75.00 (3 days * ₹25)');
  assert(rental.status === 'PENDING', 'Rental status initialized as PENDING');

  // 4. Student B tries to approve Student A\'s item (Must be forbidden)
  console.log('\n--- 4. Authorization Check: Non-owner Cannot Approve ---');
  res = await fetch(`${BASE_URL}/api/rentals/${rentalId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(res.status === 403, 'Student B forbidden from approving rental for item they do not own (HTTP 403)');

  // 5. Student A (owner) approves the request
  console.log('\n--- 5. Owner Approval ---');
  res = await fetch(`${BASE_URL}/api/rentals/${rentalId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(res.status === 200, 'Owner Student A successfully approves rental (HTTP 200)');
  const approvedRental = await res.json();
  assert(approvedRental.status === 'APPROVED', 'Rental status updated to APPROVED');
  assert(approvedRental.payment && approvedRental.payment.status === 'PENDING', 'Payment record initialized with status PENDING');

  // 6. Overlapping request rejection check
  console.log('\n--- 6. Overlap Prevention Rule ---');
  res = await fetch(`${BASE_URL}/api/rentals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      itemId,
      startDate: '2026-11-02', // Overlaps with Nov 1 - Nov 3
      endDate: '2026-11-05',
    }),
  });
  assert(res.status === 409, 'Overlapping rental request rejected with HTTP 409 Conflict');

  // 7. Payment and Return
  console.log('\n--- 7. Simulated Payment & Return Status Flow ---');
  // Owner marks payment as PAID
  res = await fetch(`${BASE_URL}/api/rentals/${rentalId}/payment/paid`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(res.status === 200, 'Owner marks simulated payment as PAID (HTTP 200)');
  const paidRental = await res.json();
  assert(paidRental.payment.status === 'PAID', 'Payment status is PAID');
  assert(paidRental.payment.transactionReference.startsWith('SIM-UPI-'), 'Simulated transaction reference generated');

  // Owner marks rental as RETURNED
  res = await fetch(`${BASE_URL}/api/rentals/${rentalId}/return`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(res.status === 200, 'Owner marks rental as RETURNED (HTTP 200)');
  const returnedRental = await res.json();
  assert(returnedRental.status === 'RETURNED', 'Rental status is RETURNED');

  // 8. Review submission by Borrower
  console.log('\n--- 8. Review Submission by Borrower ---');
  res = await fetch(`${BASE_URL}/api/rentals/${rentalId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      rating: 5,
      comment: 'Calculator worked perfectly during my math midterms. Recommended!',
    }),
  });
  assert(res.status === 201, 'Borrower Student B submits 5-star review (HTTP 201)');
  const review = await res.json();
  assert(review.rating === 5, 'Review rating is 5');

  // Duplicate review rejected
  res = await fetch(`${BASE_URL}/api/rentals/${rentalId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      rating: 4,
      comment: 'Second review attempt',
    }),
  });
  assert(res.status === 409, 'Duplicate review rejected with HTTP 409 Conflict');

  // Verify item average rating updated
  res = await fetch(`${BASE_URL}/api/items/${itemId}`);
  const itemAfterReview = await res.json();
  assert(itemAfterReview.averageRating === 5.0, 'Item average rating updated to 5.0');
  assert(itemAfterReview.totalReviews === 1, 'Total reviews count is 1');

  // 9. Student B cannot edit Student A\'s item
  console.log('\n--- 9. Ownership Protection: Non-owner Cannot Edit ---');
  res = await fetch(`${BASE_URL}/api/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      title: 'Hacked Title',
      categoryId: 1,
      dailyPrice: 10.0,
      deposit: 0,
      condition: 'FAIR',
    }),
  });
  assert(res.status === 403, 'Student B forbidden from editing Student A listing (HTTP 403)');

  // 10. Unauthenticated request returns 401
  console.log('\n--- 10. Unauthenticated Access Protection ---');
  res = await fetch(`${BASE_URL}/api/rentals/mine`);
  assert(res.status === 401, 'Unauthenticated request to protected endpoint returns HTTP 401');

  // 11. Student calling Admin endpoint returns 403
  console.log('\n--- 11. Role-Based Security: Student Forbidden from /api/admin ---');
  res = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(res.status === 403, 'Student calling /api/admin/stats returns HTTP 403 Forbidden');

  // Admin access to stats
  res = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  assert(res.status === 200, 'Admin calling /api/admin/stats returns HTTP 200 OK');
  const adminStats = await res.json();
  assert(adminStats.totalRentals >= 1, 'Admin stats reflect at least 1 total rental');

  // 12. Search, Category filtering, Sorting, Pagination
  console.log('\n--- 12. Catalog Search, Filter, Sort, Pagination ---');
  res = await fetch(`${BASE_URL}/api/items?keyword=Calculator&categoryId=1&sort=dailyPrice,asc&page=0&size=10`);
  assert(res.status === 200, 'Search and filter query returns HTTP 200');
  const searchResults = await res.json();
  assert(searchResults.content && searchResults.content.length > 0, 'Catalog returns matching items');
  assert(searchResults.pageNumber === 0, 'Pagination pageNumber is 0');

  // 13. Chatbot with RAG retrieval (No key configured fallback notice)
  console.log('\n--- 13. AI Chatbot RAG Fallback without API Key ---');
  res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Is there a scientific calculator under Rs.30 per day?',
      history: [],
    }),
  });
  assert(res.status === 200, 'Chat endpoint returns HTTP 200');
  const chatReply = await res.json();
  assert(chatReply.fallbackNotice === 'AI is not configured; showing search results', 'Fallback notice returned when no LLM key configured');
  assert(chatReply.retrievedItems.length > 0, 'Chatbot RAG retrieved relevant calculator from database');
  assert(chatReply.answer.includes('Casio Scientific Calculator fx-991EX'), 'Chat answer includes retrieved calculator title');

  console.log('\n====================================================');
  console.log(`  E2E API Test Complete: ${passes} PASSED, ${fails} FAILED`);
  console.log('====================================================');

  if (fails > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
