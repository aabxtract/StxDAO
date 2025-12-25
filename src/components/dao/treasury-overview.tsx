import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Landmark, Hash } from 'lucide-react';
import type { DaoTreasury } from '@/lib/types';

interface TreasuryOverviewProps {
  treasury: DaoTreasury;
}

export default function TreasuryOverview({ treasury }: TreasuryOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{treasury.name}</CardTitle>
        <CardDescription>Treasury Snapshot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border">
            <div className='flex items-center gap-4'>
                <Landmark className="h-6 w-6 text-primary" />
                <span className="text-muted-foreground">Total Balance</span>
            </div>
            <div className="text-2xl font-bold text-right">
                {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(treasury.stxBalance)}
                <span className="text-lg ml-1 text-muted-foreground">STX</span>
            </div>
        </div>
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border">
            <div className='flex items-center gap-4'>
                <Hash className="h-6 w-6 text-primary" />
                <span className="text-muted-foreground">Last Updated Block</span>
            </div>
            <span className="font-mono text-lg font-semibold">{treasury.lastUpdatedBlock.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
