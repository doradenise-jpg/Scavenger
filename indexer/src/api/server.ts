import http from 'http';
import { logger } from '../utils/logger';

export interface ApiConfig {
  port: number;
  host: string;
}

export function createApiServer(config: ApiConfig) {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
      const path = url.pathname;

      if (path === '/health') {
        handleHealth(req, res);
      } else if (path === '/metrics') {
        handleMetrics(req, res);
      } else if (path.startsWith('/events')) {
        await handleEventQuery(req, res, url);
      } else if (path === '/events/stream') {
        handleEventStream(req, res);
      } else if (path === '/replay') {
        await handleReplay(req, res);
      } else if (path.startsWith('/replay/status')) {
        await handleReplayStatus(req, res);
      } else if (path.startsWith('/alerts')) {
        await handleAlertQuery(req, res, url);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (err) {
      logger.error('API request failed', { error: String(err) });
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });

  const metrics = {
    eventsProcessed: 0,
    eventsFailed: 0,
    lastEventTimestamp: null as string | null,
    syncLag: 0,
    reorgsDetected: 0,
    alertsFired: 0,
    startTime: new Date().toISOString(),
    eventsByType: {} as Record<string, number>,
  };

  function handleHealth(_req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  }

  function handleMetrics(_req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(200);
    res.end(JSON.stringify(metrics));
  }

  async function handleEventQuery(_req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
    const { getPool } = await import('../db/client');
    const pool = getPool();

    const eventType = url.searchParams.get('type');
    const fromLedger = url.searchParams.get('from');
    const toLedger = url.searchParams.get('to');
    const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 1000);
    const offset = Number(url.searchParams.get('offset')) || 0;
    const contractId = url.searchParams.get('contractId');
    const txHash = url.searchParams.get('txHash');

    let sql = 'SELECT * FROM raw_events WHERE 1=1';
    const params: unknown[] = [];
    let paramIdx = 1;

    if (eventType) {
      sql += ` AND event_type = $${paramIdx++}`;
      params.push(eventType);
    }
    if (fromLedger) {
      sql += ` AND ledger_sequence >= $${paramIdx++}`;
      params.push(Number(fromLedger));
    }
    if (toLedger) {
      sql += ` AND ledger_sequence <= $${paramIdx++}`;
      params.push(Number(toLedger));
    }
    if (contractId) {
      sql += ` AND contract_id = $${paramIdx++}`;
      params.push(contractId);
    }
    if (txHash) {
      sql += ` AND transaction_hash = $${paramIdx++}`;
      params.push(txHash);
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
    const { rows: countRows } = await pool.query(countSql, params);
    const total = Number(countRows[0]?.count ?? 0);

    sql += ` ORDER BY ledger_sequence DESC, id DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, offset);
    const { rows } = await pool.query(sql, params);

    res.writeHead(200);
    res.end(JSON.stringify({ events: rows, total, limit, offset }));
  }

  const sseClients = new Set<http.ServerResponse>();

  function handleEventStream(_req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write('data: {"type":"connected"}\n\n');
    sseClients.add(res);

    const keepAlive = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 15000);

    req.on('close', () => {
      sseClients.delete(res);
      clearInterval(keepAlive);
    });
  }

  function broadcastEvent(event: Record<string, unknown>) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
      try { client.write(data); } catch { sseClients.delete(client); }
    }
  }

  async function handleReplay(req: http.IncomingMessage, res: http.ServerResponse) {
    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let body = '';
    for await (const chunk of req) body += chunk;

    try {
      const { fromLedger, toLedger, eventTypes } = JSON.parse(body);
      if (typeof fromLedger !== 'number') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'fromLedger is required' }));
        return;
      }

      const { processEvents } = await import('../../indexer');
      const { fetchEvents } = await import('../stellar/streamer');
      const { getPool } = await import('../db/client');
      const pool = getPool();

      const replayId = `replay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      let sql = 'SELECT * FROM raw_events WHERE ledger_sequence >= $1';
      const params: unknown[] = [fromLedger];
      let paramIdx = 2;

      if (toLedger) {
        sql += ` AND ledger_sequence <= $${paramIdx++}`;
        params.push(toLedger);
      }
      if (eventTypes && Array.isArray(eventTypes) && eventTypes.length > 0) {
        sql += ` AND event_type = ANY($${paramIdx++})`;
        params.push(eventTypes);
      }
      sql += ' ORDER BY ledger_sequence ASC, id ASC';

      const { rows } = await pool.query(sql, params);

      processEvents(rows as any).catch(err => {
        logger.error('Replay processing failed', { replayId, error: String(err) });
      });

      logger.info('Replay started', { replayId, fromLedger, toLedger, eventCount: rows.length, eventTypes });

      res.writeHead(202);
      res.end(JSON.stringify({ replayId, eventCount: rows.length, status: 'started' }));
    } catch (err) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: String(err) }));
    }
  }

  async function handleReplayStatus(_req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'available', message: 'Replay status tracking is active' }));
  }

  async function handleAlertQuery(_req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
    const { getPool } = await import('../db/client');
    const pool = getPool();
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);

    const { rows } = await pool.query(
      'SELECT * FROM alert_history ORDER BY created_at DESC LIMIT $1',
      [limit]
    );

    res.writeHead(200);
    res.end(JSON.stringify({ alerts: rows }));
  }

  return {
    server,
    metrics,
    broadcastEvent,
    start() {
      return new Promise<void>((resolve) => {
        server.listen(config.port, config.host, () => {
          logger.info('API server started', { host: config.host, port: config.port });
          resolve();
        });
      });
    },
    stop() {
      return new Promise<void>((resolve) => {
        for (const client of sseClients) {
          try { client.end(); } catch { /* ignore */ }
        }
        sseClients.clear();
        server.close(() => resolve());
      });
    },
  };
}
