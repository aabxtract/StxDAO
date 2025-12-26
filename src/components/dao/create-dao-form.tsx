"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocalStorage } from 'react-use';
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { openContractDeploy } from "@stacks/connect";
import { AnchorMode, PostConditionMode, stringAsciiCV } from "@stacks/transactions";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import type { KnownDao } from "@/lib/types";
import { Textarea } from "../ui/textarea";

// This is a simplified version of the Clarity contract for a basic DAO
const DAO_CONTRACT_BODY = `
(define-trait dao-trait
  ((get-name () (response (string-ascii 256) uint))
   (get-description () (response (string-ascii 512) uint))))

(define-public (initialize (name (string-ascii 256)) (description (string-ascii 512)))
    (begin
        (var-set 'name name)
        (var-set 'description description)
        (ok true)
    )
)

(define-read-only (get-name)
  (ok (var-get 'name))
)

(define-read-only (get-description)
  (ok (var-get 'description))
)
`;

const formSchema = z.object({
  name: z.string().min(3, "DAO name must be at least 3 characters long."),
  description: z.string().optional(),
});

export default function CreateDaoForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [myDaos, setMyDaos] = useLocalStorage<KnownDao[]>('my-daos', []);
  const { stxAddress, network } = useWallet();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!stxAddress || !network) {
        toast({
            variant: "destructive",
            title: "Wallet Not Connected",
            description: "Please connect your wallet to deploy a DAO.",
        });
        return;
    }
    
    const contractName = values.name.toLowerCase().replace(/\s+/g, '-');

    openContractDeploy({
        contractName,
        codeBody: DAO_CONTRACT_BODY,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
            const newDao: KnownDao = {
              name: values.name,
              contractAddress: `${stxAddress}.${contractName}`,
            };
            setMyDaos([...(myDaos || []), newDao]);
            
            toast({
              title: "Transaction Submitted!",
              description: "Your DAO deployment transaction has been submitted. It may take a few minutes to confirm.",
            });

            // We can't initialize during deploy, so we'll need to make a separate call.
            // For now, we'll just redirect. A more robust solution would handle the init call.
            router.push(`/dashboard?dao=${newDao.contractAddress}`);
        },
        onCancel: () => {
            toast({
                variant: "destructive",
                title: "Deployment Cancelled",
                description: "You cancelled the DAO contract deployment.",
            });
        }
    })
  }

  return (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Create Your On-Chain DAO</CardTitle>
            <CardDescription>Deploy a new, simple DAO contract to the Stacks blockchain.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>DAO Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., My Awesome DAO" {...field} />
                    </FormControl>
                    <FormDescription>
                        A user-friendly name for your DAO. This will also be used to generate the contract name.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DAO Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the purpose of your DAO."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A short description of what your DAO is about.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={!stxAddress}>
                  {stxAddress ? 'Deploy DAO Contract' : 'Connect Wallet to Deploy'}
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
