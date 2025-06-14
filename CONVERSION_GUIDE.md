# Raw SQL Conversion Guide

Since Supabase JavaScript client does NOT support raw SQL queries (no `supabase.postgres.query()` method exists), you have two main options:

## Option 1: Using pg library (Node PostgreSQL)

### Installation
```bash
npm install pg
npm install --save-dev @types/pg
```

### Setup
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
```

### Usage
```typescript
// Simple query
const result = await pool.query('SELECT * FROM customers WHERE customer_id = $1', [customerId]);
const customers = result.rows;

// Multiple parameters
const result = await pool.query(
  'INSERT INTO accounts (customer_id, account_type, balance) VALUES ($1, $2, $3) RETURNING *',
  [customerId, 'Checking', 1000]
);
```

## Option 2: Using postgres.js (Modern Alternative)

### Installation
```bash
npm install postgres
```

### Setup
```typescript
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require'
});
```

### Usage
```typescript
// Template literal syntax (automatically escapes parameters)
const customers = await sql`
  SELECT * FROM customers 
  WHERE customer_id = ${customerId}
`;

// With multiple parameters
const newAccount = await sql`
  INSERT INTO accounts (customer_id, account_type, balance) 
  VALUES (${customerId}, ${accountType}, ${balance})
  RETURNING *
`;
```

## Conversion Examples

### Supabase Query Builder → Raw SQL

#### SELECT with joins
```typescript
// Supabase
const { data } = await supabase
  .from('customers')
  .select(`
    *,
    accounts(*),
    loans(*)
  `)
  .eq('customer_id', customerId)
  .single();

// Raw SQL (pg)
const customerQuery = `
  SELECT c.*, 
    json_agg(DISTINCT a.*) FILTER (WHERE a.account_id IS NOT NULL) AS accounts,
    json_agg(DISTINCT l.*) FILTER (WHERE l.loan_id IS NOT NULL) AS loans
  FROM customers c
  LEFT JOIN accounts a ON c.customer_id = a.customer_id
  LEFT JOIN loans l ON c.customer_id = l.customer_id
  WHERE c.customer_id = $1
  GROUP BY c.customer_id
`;
const result = await pool.query(customerQuery, [customerId]);

// Raw SQL (postgres.js)
const customer = await sql`
  SELECT c.*, 
    json_agg(DISTINCT a.*) FILTER (WHERE a.account_id IS NOT NULL) AS accounts,
    json_agg(DISTINCT l.*) FILTER (WHERE l.loan_id IS NOT NULL) AS loans
  FROM customers c
  LEFT JOIN accounts a ON c.customer_id = a.customer_id
  LEFT JOIN loans l ON c.customer_id = l.customer_id
  WHERE c.customer_id = ${customerId}
  GROUP BY c.customer_id
`;
```

#### INSERT
```typescript
// Supabase
const { data } = await supabase
  .from('accounts')
  .insert({ customer_id: 1, account_type: 'Checking', balance: 1000 })
  .select()
  .single();

// Raw SQL (pg)
const result = await pool.query(
  'INSERT INTO accounts (customer_id, account_type, balance) VALUES ($1, $2, $3) RETURNING *',
  [1, 'Checking', 1000]
);
const data = result.rows[0];

// Raw SQL (postgres.js)
const [data] = await sql`
  INSERT INTO accounts (customer_id, account_type, balance) 
  VALUES (${1}, ${'Checking'}, ${1000})
  RETURNING *
`;
```

#### UPDATE
```typescript
// Supabase
const { data } = await supabase
  .from('accounts')
  .update({ balance: 2000 })
  .eq('account_id', accountId)
  .select()
  .single();

// Raw SQL (pg)
const result = await pool.query(
  'UPDATE accounts SET balance = $1 WHERE account_id = $2 RETURNING *',
  [2000, accountId]
);
const data = result.rows[0];

// Raw SQL (postgres.js)
const [data] = await sql`
  UPDATE accounts 
  SET balance = ${2000}
  WHERE account_id = ${accountId}
  RETURNING *
`;
```

#### DELETE
```typescript
// Supabase
const { error } = await supabase
  .from('accounts')
  .delete()
  .eq('account_id', accountId);

// Raw SQL (pg)
await pool.query('DELETE FROM accounts WHERE account_id = $1', [accountId]);

// Raw SQL (postgres.js)
await sql`DELETE FROM accounts WHERE account_id = ${accountId}`;
```

## Transaction Support

### Using pg
```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE accounts SET balance = balance - $1 WHERE account_id = $2', [amount, fromId]);
  await client.query('UPDATE accounts SET balance = balance + $1 WHERE account_id = $2', [amount, toId]);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

### Using postgres.js
```typescript
await sql.begin(async sql => {
  await sql`UPDATE accounts SET balance = balance - ${amount} WHERE account_id = ${fromId}`;
  await sql`UPDATE accounts SET balance = balance + ${amount} WHERE account_id = ${toId}`;
});
```

## Recommendation

For new projects, I recommend using **postgres.js** because:
1. Modern API with template literal support
2. Automatic parameter escaping
3. Better TypeScript support
4. Cleaner transaction syntax
5. Better performance

However, if you're already using `pg` in your project or need specific features, it's also a solid choice.