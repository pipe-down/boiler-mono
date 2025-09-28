import { getUserFromBackend } from '@/src/lib/auth/session';
import HeaderClient from './HeaderClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HeaderServer() {
  const user = await getUserFromBackend();
  return <HeaderClient user={user} />;
}
