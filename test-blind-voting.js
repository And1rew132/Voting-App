const crypto = require('crypto');
const BlindSignature = require('./blind-signature');
const { generateRandomToken, sha256Hex } = require('./crypto-utils');

async function testBlindSignatureFlow() {
  console.log('Testing Blind Signature Voting Flow...\n');
  
  const BASE_URL = 'http://localhost:3000/api';
  
  try {
    // Step 1: Get public key
    console.log('1. Getting public key...');
    const pkResponse = await fetch(`${BASE_URL}/public-key`);
    const { publicKey } = await pkResponse.json();
    console.log('✓ Public key received\n');
    
    // Step 2: Client creates and blinds a token
    console.log('2. Client creating and blinding token...');
    const tokenHex = generateRandomToken();
    const { blinded: blindedTokenHex, r } = BlindSignature.blind(tokenHex, publicKey);
    console.log('✓ Token blinded\n');
    
    // Step 3: Request blind signature from issuer (authenticated)
    console.log('3. Requesting blind signature from issuer...');
    const authToken = `user${Date.now()}`; // Use unique user ID
    const issuerResponse = await fetch(`${BASE_URL}/issuer/request-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ blindedTokenHex })
    });
    
    if (!issuerResponse.ok) {
      const error = await issuerResponse.json();
      throw new Error(`Issuer error: ${error.error}`);
    }
    
    const { sigBlindedHex } = await issuerResponse.json();
    console.log('✓ Blind signature received\n');
    
    // Step 4: Unblind the signature
    console.log('4. Unblinding signature...');
    const sigHex = BlindSignature.unblind(sigBlindedHex, publicKey, r);
    console.log('✓ Signature unblinded\n');
    
    // Step 5: Cast ballot anonymously
    console.log('5. Casting ballot anonymously...');
    const ballot = { pollId: 1, option: 'Option A' };
    const castResponse = await fetch(`${BASE_URL}/ballot/cast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenHex, sigHex, ballot })
    });
    
    if (!castResponse.ok) {
      const error = await castResponse.json();
      throw new Error(`Ballot cast error: ${error.error}`);
    }
    
    const castResult = await castResponse.json();
    console.log('✓ Ballot cast successfully');
    console.log(`  ID: ${castResult.id}`);
    console.log(`  Receipt: ${castResult.receipt}\n`);
    
    // Step 6: Verify ballot appears on public bulletin board
    console.log('6. Checking public bulletin board...');
    const pbbResponse = await fetch(`${BASE_URL}/pbb/list`);
    const { items } = await pbbResponse.json();
    console.log(`✓ Bulletin board contains ${items.length} ballot(s)`);
    if (items.length > 0) {
      console.log('  Latest ballot:', JSON.stringify(items[items.length - 1], null, 2));
    }
    
    // Step 7: Try to vote again (should fail)
    console.log('\n7. Testing double-vote prevention...');
    const doubleVoteResponse = await fetch(`${BASE_URL}/ballot/cast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenHex, sigHex, ballot: { pollId: 1, option: 'Option B' } })
    });
    
    if (doubleVoteResponse.status === 409) {
      console.log('✓ Double-vote prevention working correctly');
    } else {
      console.log('✗ Double-vote prevention failed');
    }
    
    // Step 8: Try to get another token (should fail)
    console.log('\n8. Testing one-token-per-user enforcement...');
    const doubleTokenResponse = await fetch(`${BASE_URL}/issuer/request-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ blindedTokenHex: 'dummy' })
    });
    
    if (doubleTokenResponse.status === 409) {
      console.log('✓ One-token-per-user enforcement working correctly');
    } else {
      console.log('✗ One-token-per-user enforcement failed');
    }
    
    console.log('\n🎉 Blind signature voting test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Only run if called directly
if (require.main === module) {
  testBlindSignatureFlow();
}

module.exports = testBlindSignatureFlow;