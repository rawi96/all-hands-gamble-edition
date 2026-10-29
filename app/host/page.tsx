import { isHost } from "@/lib/auth";
import { listGames } from "@/lib/game";
import { HostHome } from "@/components/host-home";
export const dynamic = "force-dynamic";
export default async function Page() {
  const authenticated = await isHost();
  return (
    <HostHome
      authenticated={authenticated}
      initialGames={authenticated ? await listGames() : []}
    />
  );
}
