import RegistrationWizard from '@/components/RegistrationWizard';
import { runSheetMigration } from '@/actions/migrate-sheet';

// Force dynamic rendering so migration runs on first request after deploy
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Auto-migrate Sheet structure on first page load after deploy
  // Runs once per server process, no-op on subsequent loads
  await runSheetMigration().catch(() => {});

  return <RegistrationWizard />;
}
