import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="p-10 text-center">
        <div className="flex justify-center mb-4">
          <Info className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Welcome to Stacks DAO View</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This is a read-only transparency dashboard for DAOs on the Stacks blockchain. You can inspect any DAO's treasury and governance proposals without connecting a wallet.
        </p>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
          Select a known DAO or enter a contract address above to get started.
        </p>
      </CardContent>
    </Card>
  );
}
