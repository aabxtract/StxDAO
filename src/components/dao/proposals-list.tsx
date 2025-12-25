import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { Proposal, ProposalStatus } from '@/lib/types';
import { Button } from '../ui/button';

interface ProposalsListProps {
  proposals: Proposal[];
  daoAddress: string;
}

function getStatusVariant(status: ProposalStatus): "default" | "secondary" | "destructive" {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Passed':
      return 'secondary';
    case 'Rejected':
      return 'destructive';
  }
}

export default function ProposalsList({ proposals, daoAddress }: ProposalsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Proposals</CardTitle>
        <CardDescription>All governance proposals submitted to the DAO.</CardDescription>
      </CardHeader>
      <CardContent>
        {proposals.length > 0 ? (
          <div className='border rounded-md'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-[120px] text-center">Status</TableHead>
                <TableHead className="w-[50px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id} className="group">
                  <TableCell className="font-medium">{proposal.title}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusVariant(proposal.status)}>{proposal.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link
                        href={`/proposals/${proposal.id}?dao=${daoAddress}`}
                        title="View details"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8 border rounded-md border-dashed">
            <p>No proposals found for this DAO.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
