const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// Import our blind signature and database modules
const BlindSignature = require('./blind-signature');
const { db, appendToBulletin } = require('./db');
const { sha256Hex, generateRandomToken } = require('./crypto-utils');

const app = express();
const PORT = process.env.PORT || 3000;

// Load RSA keys from environment
const TI_PRIVATE_KEY_PEM = process.env.TI_PRIVATE_KEY_PEM?.replace(/\\n/g, '\n');
const TI_PUBLIC_KEY_PEM = process.env.TI_PUBLIC_KEY_PEM?.replace(/\\n/g, '\n');

// Security middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for polls and votes (minimal approach)
let polls = [];
let votes = {};
let pollCounter = 1;

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    polls: polls.length,
    blindSignatureEnabled: !!(TI_PRIVATE_KEY_PEM && TI_PUBLIC_KEY_PEM)
  });
});

// Blind signature endpoints

// 1) Token Issuer endpoint - signs blinded tokens once per user
app.post('/api/issuer/request-token', async (req, res) => {
  try {
    // For this demo, we'll use a simple authentication check
    // In production, this would use proper OIDC/JWT verification
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    // Extract user ID (in production, verify JWT token)
    const token = authHeader.split(' ')[1];
    const userId = token; // Simplified - in production decode JWT
    
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    // Check if token was already issued for this user
    const wasIssued = await db.get(`issued:${userId}`);
    if (wasIssued) {
      return res.status(409).json({ error: 'already_issued' });
    }
    
    // Get blinded token from request
    const { blindedTokenHex } = req.body || {};
    if (!blindedTokenHex) {
      return res.status(400).json({ error: 'missing_blinded_token' });
    }
    
    if (!TI_PRIVATE_KEY_PEM) {
      return res.status(500).json({ error: 'server_not_configured' });
    }
    
    // Sign the blinded message
    const sigBlindedHex = BlindSignature.sign(blindedTokenHex, TI_PRIVATE_KEY_PEM);
    
    // Mark token as issued for this user
    await db.set(`issued:${userId}`, true);
    
    return res.status(200).json({ sigBlindedHex });
  } catch (e) {
    console.error('Issuer error:', e);
    return res.status(500).json({ error: 'issuer_error' });
  }
});

// 2) Ballot casting endpoint - validates tokens and records ballots
app.post('/api/ballot/cast', async (req, res) => {
  try {
    const { tokenHex, sigHex, ballot } = req.body || {};
    
    if (!tokenHex || !sigHex || !ballot) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    
    if (!TI_PUBLIC_KEY_PEM) {
      return res.status(500).json({ error: 'server_not_configured' });
    }
    
    // Verify signature on token
    const isValid = BlindSignature.verify(sigHex, tokenHex, TI_PUBLIC_KEY_PEM);
    if (!isValid) {
      return res.status(400).json({ error: 'invalid_token_signature' });
    }
    
    // Check if token was already spent
    const tokenHash = sha256Hex(tokenHex);
    const spent = await db.get(`spent:${tokenHash}`);
    if (spent) {
      return res.status(409).json({ error: 'token_already_used' });
    }
    
    // Record the ballot
    const id = crypto.randomUUID();
    const ts = Date.now();
    
    const ballotRecord = {
      id,
      ballot,
      tokenHash,
      ts
    };
    
    // Mark token as spent and store ballot
    await db.set(`spent:${tokenHash}`, true);
    await appendToBulletin(ballotRecord);
    
    // Generate receipt
    const receipt = sha256Hex(tokenHash + sha256Hex(JSON.stringify(ballot)));
    
    return res.status(200).json({ 
      ok: true, 
      id, 
      tokenHash, 
      receipt, 
      ts 
    });
  } catch (e) {
    console.error('Ballot cast error:', e);
    return res.status(500).json({ error: 'ballot_box_error' });
  }
});

// 3) Public Bulletin Board endpoint - list all ballots
app.get('/api/pbb/list', async (req, res) => {
  try {
    const entries = await db.list('ballots:');
    const items = entries.map(({ key, value }) => ({
      id: key.split(':')[1],
      ...value
    }));
    
    return res.status(200).json({ items });
  } catch (e) {
    console.error('PBB error:', e);
    return res.status(500).json({ error: 'pbb_error' });
  }
});

// Get public key for verification
app.get('/api/public-key', (req, res) => {
  if (!TI_PUBLIC_KEY_PEM) {
    return res.status(500).json({ error: 'server_not_configured' });
  }
  res.json({ publicKey: TI_PUBLIC_KEY_PEM });
});

// Legacy poll endpoints (keep for backward compatibility)

// Get all polls
app.get('/api/polls', (req, res) => {
  res.json(polls);
});

// Create a new poll
app.post('/api/polls', (req, res) => {
  const { question, options, languages } = req.body;
  
  if (!question || !options || options.length < 2) {
    return res.status(400).json({ error: 'Poll must have a question and at least 2 options' });
  }
  
  const poll = {
    id: pollCounter++,
    question: question,
    options: options,
    languages: languages || { en: question },
    createdAt: new Date().toISOString(),
    active: true
  };
  
  polls.push(poll);
  votes[poll.id] = {};
  
  res.status(201).json(poll);
});

// Get specific poll
app.get('/api/polls/:id', (req, res) => {
  const pollId = parseInt(req.params.id);
  const poll = polls.find(p => p.id === pollId);
  
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  
  res.json(poll);
});

// Submit vote
app.post('/api/polls/:id/vote', (req, res) => {
  const pollId = parseInt(req.params.id);
  const { option, voterId } = req.body;
  
  const poll = polls.find(p => p.id === pollId);
  
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  
  if (!poll.active) {
    return res.status(400).json({ error: 'Poll is not active' });
  }
  
  if (!option || !poll.options.includes(option)) {
    return res.status(400).json({ error: 'Invalid option' });
  }
  
  // Simple duplicate vote prevention using IP or voterId
  const voterKey = voterId || req.ip;
  if (votes[pollId][voterKey]) {
    return res.status(400).json({ error: 'You have already voted in this poll' });
  }
  
  votes[pollId][voterKey] = {
    option: option,
    timestamp: new Date().toISOString()
  };
  
  res.json({ message: 'Vote recorded successfully' });
});

// Get poll results
app.get('/api/polls/:id/results', (req, res) => {
  const pollId = parseInt(req.params.id);
  const poll = polls.find(p => p.id === pollId);
  
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  
  const pollVotes = votes[pollId] || {};
  const results = {};
  let totalVotes = 0;
  
  // Initialize results
  poll.options.forEach(option => {
    results[option] = 0;
  });
  
  // Count votes
  Object.values(pollVotes).forEach(vote => {
    results[vote.option]++;
    totalVotes++;
  });
  
  res.json({
    poll: poll,
    results: results,
    totalVotes: totalVotes
  });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`EU Voting App running on port ${PORT}`);
});

module.exports = app;