import Header from "@/components/layout/header";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="flex flex-col gap-8">
            <div className="border-dashed rounded-lg border-2 border-border p-10 text-center flex flex-col items-center justify-center h-64">
             <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
             </div>
             <p className="text-muted-foreground">Loading On-Chain Data...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
