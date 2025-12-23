import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { groupBuys } from '@/data/mockData';
import { GroupBuyCard } from '@/components/products/GroupBuyCard';
import { Button } from '@/components/ui/button';

export function GroupBuySection() {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold font-serif text-foreground mb-1">
                Active Group Buys
              </h2>
              <p className="text-muted-foreground">
                Join together, save more
              </p>
            </div>
          </div>
          <Link to="/group-buys">
            <Button variant="ghost" className="group">
              View All
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupBuys.map((groupBuy) => (
            <GroupBuyCard key={groupBuy.id} groupBuy={groupBuy} />
          ))}
        </div>

        {/* How it works */}
        <div className="mt-12 p-8 rounded-2xl bg-card border border-border">
          <h3 className="text-xl font-bold text-foreground mb-6 text-center">
            How Group Buys Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold text-foreground mb-1">Join a Group</h4>
              <p className="text-sm text-muted-foreground">
                Find a product and join the group buy
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold text-foreground mb-1">Share & Invite</h4>
              <p className="text-sm text-muted-foreground">
                Invite friends to unlock bigger discounts
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold text-foreground mb-1">Goal Reached</h4>
              <p className="text-sm text-muted-foreground">
                When the group fills, the deal goes through
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-3">
                4
              </div>
              <h4 className="font-semibold text-foreground mb-1">Save Together</h4>
              <p className="text-sm text-muted-foreground">
                Everyone gets the discounted price
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
