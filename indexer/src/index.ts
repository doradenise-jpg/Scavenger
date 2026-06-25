import 'dotenv/config';
import { runMigrations } from './db/migrate';
import { runIndexer } from './indexer';
import { createApiServer } from './api/server';
import { startAlertChecker, createAlertHistoryTable } from './monitoring/alerts';
import { logger } from './utils/logger';

async function main() {
  const rpcUrl = process.env.STELLAR_RPC_URL;
  const contractId = process.env.CONTRACT_ID;

  if (!rpcUrl || !contractId) {
    throw new Error('STELLAR_RPC_URL and CONTRACT_ID must be set');
  }

  logger.info('Starting Scavngr indexer', { rpcUrl, contractId });

  await runMigrations();
  await createAlertHistoryTable();

  const apiPort = Number(process.env.API_PORT ?? 3001);
  const apiHost = process.env.API_HOST ?? '0.0.0.0';

  const api = createApiServer({ port: apiPort, host: apiHost });
  await api.start();

  startAlertChecker();

  await runIndexer(
    {
      rpcUrl,
      contractId,
      startLedger: Number(process.env.START_LEDGER ?? 0),
    },
    Number(process.env.POLL_INTERVAL_MS ?? 5000),
    api.metrics,
    api.broadcastEvent
  );
}

main().catch(err => {
  logger.error('Fatal error', { error: String(err) });
  process.exit(1);
});
