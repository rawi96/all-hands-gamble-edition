export const metadata = { robots: { index: false, follow: false } };
import { Play } from "@/components/play";
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <Play code={code.toUpperCase()} />;
}
