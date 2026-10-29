import { redirect } from "next/navigation";
import { isHost } from "@/lib/auth";
import { HostControl } from "@/components/host-control";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  if (!(await isHost())) redirect("/host");
  const { code } = await params;
  return <HostControl code={code.toUpperCase()} />;
}
