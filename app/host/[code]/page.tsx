export const metadata = { robots: { index: false, follow: false } };
import Link from "next/link";
import { isHost } from "@/lib/auth";
import { HostControl } from "@/components/host-control";
import { Header } from "@/components/shared";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ prepare?: string }>;
}) {
  const { code } = await params;
  if (!(await isHost(code)))
    return (
      <>
        <Header />
        <main className="player-shell">
          <section className="panel form-panel">
            <span className="eyebrow">DIESE RUNDE GEHÖRT JEMAND ANDEREM</span>
            <h1>Mitspielen? Sehr gern.</h1>
            <p>
              Die Spielleitung bleibt in dem Browser, in dem das Spiel erstellt
              wurde.
            </p>
            <Link
              className="button full"
              href={`/play/${encodeURIComponent(code.toUpperCase())}`}
            >
              Diesem Spiel beitreten
            </Link>
            <Link className="text-link" href="/host">
              Eigenes Spiel erstellen →
            </Link>
          </section>
        </main>
      </>
    );
  const query = await searchParams;
  return (
    <HostControl
      code={code.toUpperCase()}
      startInPreparation={query.prepare === "1"}
    />
  );
}
