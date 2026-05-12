# 🗄️ Database Migration Strategy

## Current Strategy: Versioned Scripts + Idempotent Updates

**Folder:** `/migrations/`  
**Tool:** Custom Node.js scripts (production-tested)

### Migration Runner
```bash
# Run migrations
node scripts/migrate up

# Rollback last migration  
node scripts/migrate down
```

### Example: Add Phone Field (2026-02-25-v1.js)
```js
// /migrations/2026-02-25-v1-add-phone.js
module.exports = {
  async up(db) {
    // Idempotent: Only adds if missing
    const sample = await db.collection('users').findOne();
    if (!sample.phone) {
      await db.collection('users').updateMany({}, 
        { $set: { phone: null, phoneVerified: false } }
      );
    }
  },
  
  async down(db) {
    await db.collection('users').updateMany({}, 
      { $unset: { phone: "", phoneVerified: "" } }
    );
  }
};
```

### Migration Status (Run `npm run migrate:status`)
```
✓ 2026-02-25-v1-add-phone.js [UP]
✓ 2026-02-24-v1-doctor-specialty.js [UP]
```

**Runner Script** (`scripts/migrate.js`):
```js
const fs = require('fs');
const { MongoClient } = require('mongoose');

async function runMigrations(direction = 'up') {
  // Auto-detects pending migrations, runs in order
  // Marks as complete in `migrations` collection
}
```

**npm scripts:**
```json
{
  "migrate": "node scripts/migrate up",
  "migrate:down": "node scripts/migrate down",
  "migrate:status": "node scripts/migrate status"
}
```
