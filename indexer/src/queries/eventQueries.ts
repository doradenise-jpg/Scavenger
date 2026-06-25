import { getPool } from '../db/client';

export interface EventFilter {
  eventType?: string;
  fromLedger?: number;
  toLedger?: number;
  contractId?: string;
  transactionHash?: string;
  limit?: number;
  offset?: number;
}

export interface EventQueryResult {
  events: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
}

export async function queryEvents(filter: EventFilter): Promise<EventQueryResult> {
  const pool = getPool();
  const limit = Math.min(filter.limit ?? 100, 1000);
  const offset = filter.offset ?? 0;

  let sql = 'SELECT * FROM raw_events WHERE 1=1';
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filter.eventType) {
    sql += ` AND event_type = $${paramIdx++}`;
    params.push(filter.eventType);
  }
  if (filter.fromLedger !== undefined) {
    sql += ` AND ledger_sequence >= $${paramIdx++}`;
    params.push(filter.fromLedger);
  }
  if (filter.toLedger !== undefined) {
    sql += ` AND ledger_sequence <= $${paramIdx++}`;
    params.push(filter.toLedger);
  }
  if (filter.contractId) {
    sql += ` AND contract_id = $${paramIdx++}`;
    params.push(filter.contractId);
  }
  if (filter.transactionHash) {
    sql += ` AND transaction_hash = $${paramIdx++}`;
    params.push(filter.transactionHash);
  }

  const countResult = await pool.query(
    sql.replace('SELECT *', 'SELECT COUNT(*)::int as total'),
    params
  );
  const total = countResult.rows[0]?.total ?? 0;

  sql += ` ORDER BY ledger_sequence DESC, id DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const { rows } = await pool.query(sql, params);

  return { events: rows, total, limit, offset };
}

export async function queryEventTypes(): Promise<string[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT DISTINCT event_type FROM raw_events ORDER BY event_type'
  );
  return rows.map(r => r.event_type);
}

export async function queryEventsByDateRange(
  startDate: Date,
  endDate: Date,
  eventType?: string
): Promise<{ date: string; count: number }[]> {
  const pool = getPool();
  const params: unknown[] = [startDate, endDate];
  let typeFilter = '';
  if (eventType) {
    typeFilter = ' AND event_type = $3';
    params.push(eventType);
  }

  const { rows } = await pool.query(
    `SELECT DATE(created_at) as date, COUNT(*)::int as count
     FROM raw_events
     WHERE created_at >= $1 AND created_at <= $2${typeFilter}
     GROUP BY DATE(created_at)
     ORDER BY date`,
    params
  );

  return rows.map(r => ({ date: r.date.toISOString().slice(0, 10), count: r.count }));
}
