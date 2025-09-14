// Simple in-memory database abstraction
// In production, this would be replaced with Redis, DynamoDB, etc.

class SimpleDB {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    return this.data.get(key);
  }

  async set(key, value) {
    this.data.set(key, value);
    return true;
  }

  async list(prefix) {
    const results = [];
    for (const [key, value] of this.data.entries()) {
      if (key.startsWith(prefix)) {
        results.push({ key, value });
      }
    }
    return results;
  }

  async delete(key) {
    return this.data.delete(key);
  }
}

// Global database instance
const db = new SimpleDB();

// Public bulletin board functions
async function appendToBulletin(ballot) {
  const key = `ballots:${ballot.id}`;
  await db.set(key, ballot);
  return ballot;
}

module.exports = {
  db,
  appendToBulletin
};