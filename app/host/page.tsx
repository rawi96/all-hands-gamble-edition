export const metadata = { robots: { index: false, follow: false } };
import { creatorHash } from "@/lib/auth";
import { listGames } from "@/lib/game";
import { HostHome } from "@/components/host-home";
export const dynamic = "force-dynamic";
export default async function Page() {
  return <HostHome initialGames={await listGames(await creatorHash())} />;
}
