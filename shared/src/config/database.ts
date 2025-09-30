import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export type DatabaseClient = {
  query: <T extends QueryResultRow = QueryResultRow>(text: string, params?: any[]) => Promise<QueryResult<T>>;
  transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
  close: () => Promise<void>;
  getPool: () => Pool;
};

function resolveConfig(config?: DatabaseConfig): DatabaseConfig {
  return (
    config || {
      host: process.env.POSTGRES_HOST!,
      port: parseInt(process.env.POSTGRES_PORT!),
      database: process.env.POSTGRES_DB!,
      user: process.env.POSTGRES_USER!,
      password: process.env.POSTGRES_PASSWORD!,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  );
}

export function createPool(config?: DatabaseConfig): Pool {
  const dbConfig = resolveConfig(config)
  const pool = new Pool(dbConfig);
  pool.on("error", (err) => {
    console.log("Unexpected error on idle client", err);
    process.exit(-1);
  });
  return pool;
}

export async function queryWithPool<T extends QueryResultRow = QueryResultRow>(
  pool: Pool,
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    const result = await client.query<T>(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function transactionWithPool<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function closePool(pool: Pool): Promise<void> {
  await pool.end();
}

export function createDatabase(config?: DatabaseConfig): DatabaseClient {
  const pool = createPool(config);

  return {
    query: (text, params) => queryWithPool(pool, text, params),
    transaction: (callback) => transactionWithPool(pool, callback),
    close: () => closePool(pool),
    getPool: () => pool,
  };
}

export default createDatabase;
