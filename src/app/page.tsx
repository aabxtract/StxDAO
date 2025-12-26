import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bitcoin, Telescope, BarChart } from 'lucide-react';
import Header from '@/components/layout/header';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 md:px-8 py-20 md:py-32 text-center">
          <div className="flex justify-center mb-6">
            <Bitcoin className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">StackSight DAO</h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Bitcoin-Secured DAO Transparency on Stacks.
            <br />
            View DAO treasuries and governance proposals, no wallet needed.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard">Launch Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                Learn More
              </a>
            </Button>
          </div>
        </section>

        <section className="bg-muted/20 py-20">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Telescope className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Explore DAOs</h3>
                <p className="text-muted-foreground">
                  Select from a list of known DAOs or enter a contract address to inspect its on-chain data.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <BarChart className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Visualize Treasuries</h3>
                <p className="text-muted-foreground">
                  View current treasury balances and historical financial data with interactive charts.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Bitcoin className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Your Own DAO</h3>
                <p className="text-muted-foreground">
                  Deploy your own simple DAO contract directly to the Stacks network.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-6 border-t">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <p>Built on Stacks, Secured by Bitcoin.</p>
        </div>
      </footer>
    </div>
  );
}
