"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { KnownDao } from '@/lib/types';

interface DaoSelectorProps {
  knownDaos: KnownDao[];
}

export default function DaoSelector({ knownDaos }: DaoSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [address, setAddress] = useState(searchParams.get('dao') || '');

  const handleViewDao = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (address) {
      router.push(`/?dao=${address}`);
    }
  };

  const handleSelectDao = (value: string) => {
    if (value) {
      setAddress(value);
      router.push(`/?dao=${value}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a DAO</CardTitle>
        <CardDescription>Enter a Stacks contract address or choose from a list to view its treasury and proposals.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6 items-end">
          <form onSubmit={handleViewDao} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dao-address">DAO Contract Address</Label>
              <Input
                id="dao-address"
                placeholder="e.g., ST1PQHQKV0RJX...my-dao"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">View DAO</Button>
          </form>

          <div className="flex items-center gap-4 md:hidden">
            <div className="flex-1 border-t border-border"></div>
            <span className="text-muted-foreground text-xs">OR</span>
            <div className="flex-1 border-t border-border"></div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="known-daos">Choose a known DAO</Label>
            <Select onValueChange={handleSelectDao} value={searchParams.get('dao') ?? ''}>
              <SelectTrigger id="known-daos" className="w-full">
                <SelectValue placeholder="Select a DAO" />
              </SelectTrigger>
              <SelectContent>
                {knownDaos.map((dao) => (
                  <SelectItem key={dao.contractAddress} value={dao.contractAddress}>
                    {dao.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
