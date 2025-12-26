import Header from '@/components/layout/header';
import CreateDaoForm from '@/components/dao/create-dao-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateDaoPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to DAO Overview
            </Link>
          </Button>
        </div>
        <CreateDaoForm />
      </main>
    </div>
  );
}
