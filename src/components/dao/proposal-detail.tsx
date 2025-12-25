import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { ProposalDetails, ProposalStatus } from '@/lib/types';
import { CheckCircle, XCircle, Hash, User } from 'lucide-react';
import { Separator } from '../ui/separator';

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

export default function ProposalDetail({ proposal }: { proposal: ProposalDetails }) {
  const totalVotes = proposal.votes.yes + proposal.votes.no;
  const yesPercentage = totalVotes > 0 ? (proposal.votes.yes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (proposal.votes.no / totalVotes) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col-reverse sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <CardTitle className="text-3xl mb-2 font-bold">{proposal.title}</CardTitle>
            <CardDescription>Proposal ID: {proposal.id}</CardDescription>
          </div>
          <Badge variant={getStatusVariant(proposal.status)} className="text-base px-4 py-1 self-start sm:self-auto">{proposal.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <p className="text-lg text-muted-foreground">{proposal.description}</p>
        
        <Separator />

        <div className="space-y-4">
            <h3 className="text-xl font-semibold">Voting Results</h3>
            <div className="space-y-3">
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm mb-1">
                        <span className="font-medium flex items-center gap-2"><CheckCircle className="text-primary h-5 w-5"/> Yes</span>
                        <span className="text-muted-foreground">{proposal.votes.yes.toLocaleString()} votes ({yesPercentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={yesPercentage} className="h-3" />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm mb-1">
                        <span className="font-medium flex items-center gap-2"><XCircle className="text-destructive h-5 w-5"/> No</span>
                        <span className="text-muted-foreground">{proposal.votes.no.toLocaleString()} votes ({noPercentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={noPercentage} className="h-3 [&>*]:bg-destructive" />
                </div>
            </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <User className="h-6 w-6 text-primary"/>
            <div>
              <p className="text-muted-foreground">Proposer</p>
              <p className="font-mono font-semibold truncate">{proposal.proposer}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Hash className="h-6 w-6 text-primary"/>
            <div>
              <p className="text-muted-foreground">Creation Block</p>
              <p className="font-mono font-semibold">{proposal.creationBlock.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
