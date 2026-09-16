import Header from "@/components/layout/Header";
import HydrationGuardProvider from "@/components/providers/HydrationGuardProvider";


export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <HydrationGuardProvider>
      <Header />
      <main className="flex-1 pt-0 w-full max-w-full overflow-x-clip">{children}</main>
    </HydrationGuardProvider>
  );
}
