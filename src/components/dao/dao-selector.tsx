"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocalStorage } from 'react-use';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { KnownDao } from '@/lib/types';

interface DaoSelectorProps {
  knownDaos: KnownDao[];
}

export default function DaoSelector({ knownDaos }: DaoSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [address, setAddress] = useState(searchParams.get('dao') || '');
  const [myDaos] = useLocalStorage<KnownDao[]>('my-daos', []);

  const handleViewDao = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (address) {
      router.push(`/dashboard?dao=${address}`);
    }
  };

  const handleSelectDao = (value: string) => {
    if (value) {
      setAddress(value);
      router.push(`/dashboard?dao=${value}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a DAO</CardTitle>
        <CardDescription>Enter a Stacks contract address or choose from a list to view its treasury and proposals.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="known" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="known">Known DAOs</TabsTrigger>
            <TabsTrigger value="my-daos">My DAOs</TabsTrigger>
          </TabsList>
          <TabsContent value="known" className="mt-4">
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
          </TabsContent>
          <TabsContent value="my-daos" className="mt-4">
            <div className="space-y-2">
              <Label htmlFor="my-daos-select">Choose one of your DAOs</Label>
               {myDaos && myDaos.length > 0 ? (
                <Select onValueChange={handleSelectDao} value={searchParams.get('dao') ?? ''}>
                  <SelectTrigger id="my-daos-select" className="w-full">
                    <SelectValue placeholder="Select one of your DAOs" />
                  </SelectTrigger>
                  <SelectContent>
                    {myDaos.map((dao) => (
                      <SelectItem key={dao.contractAddress} value={dao.contractAddress}>
                        {dao.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center text-muted-foreground p-4 border rounded-md border-dashed">
                  <p>You haven't created any DAOs yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 border-t border-border"></div>
          <span className="text-muted-foreground text-xs">OR</span>
          <div className="flex-1 border-t border-border"></div>
        </div>

        <form onSubmit={handleViewDao} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dao-address">Enter DAO Contract Address Manually</Label>
            <Input
              id="dao-address"
              placeholder="e.g., ST1PQHQKV0RJX...my-dao"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto">View DAO by Address</Button>
        </form>
      </CardContent>
    </Card>
  );
}
