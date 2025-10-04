import Link from "next/link";

export default function Page() {
  return (
    <div className="flex h-screen text-9xl w-full items-center justify-center">
      <Link href="/dashboard">DASHBOARD</Link>
    </div>
  );
}
