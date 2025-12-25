import { Suspense } from 'react';
import Header from '@/components/layout/header';
import DaoSelector from '@/components/dao/dao-selector';
import { getKnownDaos, getDaoTreasury, getDaoProposals } from '@/lib/dao';
import TreasuryOverview from '@/components/dao/treasury-overview';
import ProposalsList from '@/components/dao/proposals-list';
import EmptyState from '@/components/dao/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default async function Home({ searchParams }: { searchParams?: { dao?: string } }) {
  const knownDaos = await getKnownDaos();
  const selectedDaoAddress = searchParams?.dao;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="flex flex-col gap-8">
          <DaoSelector knownDaos={knownDaos} />
          {selectedDaoAddress ? (
            <Suspense fallback={<DaoDataSkeleton />}>
              <DaoData daoAddress={selectedDaoAddress} />
            </Suspense>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}

async function DaoData({ daoAddress }: { daoAddress: string }) {
  const treasury = await getDaoTreasury(daoAddress);
  const proposals = await getDaoProposals(daoAddress);

  if (!treasury) {
    return <Card className="border-destructive"><CardContent className="p-6"><p className="text-center text-destructive">DAO not found for address: {daoAddress}</p></CardContent></Card>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 flex flex-col gap-8">
        <TreasuryOverview treasury={treasury} />
      </div>
      <div className="lg:col-span-2">
        <ProposalsList proposals={proposals} daoAddress={daoAddress} />
      </div>
    </div>
  );
}

function DaoDataSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 flex flex-col gap-8">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/4 mb-4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
