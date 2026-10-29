import { redirect } from "next/navigation";
// Keep existing bookmarks working. There is no separate projection view anymore.
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/host/${encodeURIComponent(code.toUpperCase())}`);
}
