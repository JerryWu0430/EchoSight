"use client"
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFormPage = pathname === '/form';

  return (
    <div className="max-w-7xl mx-auto w-full relative z-[1] flex flex-col min-h-screen">
      <div className="px-5 gap-8 flex flex-col flex-1 py-[5vh]">
        {!isFormPage}
        <main className="flex justify-center">{children}</main>
      </div>
    </div>
  );
} 