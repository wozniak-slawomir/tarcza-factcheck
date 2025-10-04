import Link from "next/link";

export default function Page() {
  return (
    <div className="flex h-screen text-9xl w-full items-center justify-center gap-8">
      <Link href="/dashboard" className="hover:underline">DASHBOARD</Link>
      <Link href="/test-post" className="hover:underline">TEST POST</Link>
    </div>
  );
}
