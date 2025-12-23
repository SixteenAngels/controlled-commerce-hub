import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GroupBuyCard } from '@/components/products/GroupBuyCard';
import { groupBuys } from '@/data/mockData';
import { Users } from 'lucide-react';

export default function GroupBuys() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-serif text-foreground mb-3">
            Group Buys
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join forces with other shoppers to unlock exclusive discounts.
            The more people join, the more everyone saves!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          <div className="text-center p-4 rounded-xl bg-card border border-border">
            <p className="text-3xl font-bold text-primary">
              {groupBuys.length}
            </p>
            <p className="text-sm text-muted-foreground">Active Groups</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card border border-border">
            <p className="text-3xl font-bold text-primary">
              {groupBuys.reduce((sum, g) => sum + g.currentParticipants, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Participants</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card border border-border">
            <p className="text-3xl font-bold text-primary">
              Up to 25%
            </p>
            <p className="text-sm text-muted-foreground">Savings</p>
          </div>
        </div>

        {/* Group Buy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupBuys.map((groupBuy) => (
            <GroupBuyCard key={groupBuy.id} groupBuy={groupBuy} />
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-card border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Why Group Buy?
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Save up to 25% on regular prices
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Share shipping costs with others
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Get access to bulk pricing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Easy refund if group doesn't fill
              </li>
            </ul>
          </div>
          <div className="p-8 rounded-2xl bg-card border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Group Buy Rules
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                Groups have a minimum participant requirement
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                Deadline must be met for the deal to proceed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                Share with friends to fill the group faster
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">4.</span>
                Full refund if the group doesn't reach its goal
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
