const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
    polls: polls.length 
  });
});

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