import { Pool } from 'pg';

// Create a connection pool using pg library as fallback
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Create a postgres.js-compatible interface using pg
interface SqlQuery {
  (strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
  begin: (callback: (sql: any) => Promise<any>) => Promise<any>;
}

const sql: SqlQuery = async (strings: TemplateStringsArray, ...values: any[]) => {
  // Build the query string with placeholders
  let query = strings[0];
  values.forEach((value, i) => {
    query += `$${i + 1}` + strings[i + 1];
  });

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Add transaction support
sql.begin = async (callback: (sql: any) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create a scoped sql function for this transaction
    const txSql = async (strings: TemplateStringsArray, ...values: any[]) => {
      let query = strings[0];
      values.forEach((value, i) => {
        query += `$${i + 1}` + strings[i + 1];
      });
      const result = await client.query(query, values);
      return result.rows;
    };
    
    const result = await callback(txSql);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Test connection
pool.query('SELECT 1').then(() => {
  console.log('✓ Database connected successfully');
}).catch((err) => {
  console.error('✗ Database connection failed:', err.message);
});

export default sql;