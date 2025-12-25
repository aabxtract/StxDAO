import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/header';
import ProposalDetail from '@/components/dao/proposal-detail';
import { getProposalDetails } from '@/lib/dao';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { dao?: string };
}) {
  if (!searchParams.dao) {
    notFound();
  }

  const proposal = await getProposalDetails(params.id);

  if (!proposal || proposal.daoContractAddress !== searchParams.dao) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <Button asChild variant="outline">
            <Link href={`/?dao=${searchParams.dao}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to DAO Overview
            </Link>
          </Button>
        </div>
        <ProposalDetail proposal={proposal} />
      </main>
    </div>
  );
}
