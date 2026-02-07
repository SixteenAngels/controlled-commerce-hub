import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LiveChatWidget } from '@/components/support/LiveChatWidget';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  CreditCard, 
  Truck, 
  RotateCcw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const faqs = [
  {
    category: 'Orders & Shipping',
    icon: Package,
    questions: [
      {
        q: 'How do I track my order?',
        a: 'You can track your order by going to "My Orders" in your profile or using the Track Order feature. Enter your order number to see real-time updates on your shipment location and estimated delivery date.'
      },
      {
        q: 'What shipping options are available?',
        a: 'We offer Air Normal (7-10 days) and Air Express (1-3 days) shipping. Shipping costs vary based on product weight and destination.'
      },
      {
        q: 'Can I change my shipping address after placing an order?',
        a: 'You can change your shipping address within 24 hours of placing your order by contacting our support team. After this window, address changes may not be possible if the order has already been shipped.'
      }
    ]
  },
  {
    category: 'Payments',
    icon: CreditCard,
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept mobile money payments through Paystack, including MTN Mobile Money, Vodafone Cash, and AirtelTigo Money. All transactions are secure and encrypted.'
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes! We use Paystack, a PCI-DSS compliant payment processor. Your payment details are never stored on our servers and all transactions are encrypted.'
      },
      {
        q: 'Why was my payment declined?',
        a: 'Payments may be declined due to insufficient funds, incorrect details, or bank restrictions. Please verify your payment information or try an alternative payment method.'
      }
    ]
  },
  {
    category: 'Returns & Refunds',
    icon: RotateCcw,
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 14 days of delivery for unused items in original packaging. Some products may have specific return conditions. Contact support to initiate a return.'
      },
      {
        q: 'How long do refunds take?',
        a: 'Once your return is received and approved, refunds are processed within 5-7 business days. The funds will be returned to your original payment method.'
      },
      {
        q: 'Can I exchange an item instead of returning it?',
        a: 'Yes! Contact our support team to arrange an exchange. We\'ll guide you through the process and ensure you get the right product.'
      }
    ]
  },
  {
    category: 'Group Buys',
    icon: Truck,
    questions: [
      {
        q: 'What is a Group Buy?',
        a: 'Group Buys allow multiple customers to purchase together and enjoy discounts. When enough people join, everyone gets a reduced price on their order.'
      },
      {
        q: 'How do I join a Group Buy?',
        a: 'Browse our Group Buys section, select a product you\'re interested in, and click "Join Group Buy". You\'ll be charged only when the minimum participants are reached.'
      },
      {
        q: 'What happens if a Group Buy doesn\'t reach its target?',
        a: 'If a Group Buy doesn\'t reach the minimum participants before the deadline, it will be cancelled and any holds on your payment will be released.'
      }
    ]
  }
];

export default function Help() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Message Sent!',
      description: 'We\'ll get back to you within 24 hours.',
    });
    
    setName('');
    setEmail('');
    setMessage('');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-4">
            How Can We Help?
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">
                Chat with our team in real-time
              </CardDescription>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>9 AM - 6 PM GMT</span>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Email Us</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">
                support@ihsan.com
              </CardDescription>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                <span>Response in 24 hours</span>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Call Us</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">
                +233 XX XXX XXXX
              </CardDescription>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Accra, Ghana</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQs Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold font-serif mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {faqs.map((category) => (
              <Card key={category.category}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <category.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`${category.category}-${index}`}
                        className="border-b-0"
                      >
                        <AccordionTrigger className="text-left text-sm hover:no-underline py-3">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-sm">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
            <CardDescription>
              Send us a message and we'll get back to you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      
      <LiveChatWidget />
      <Footer />
    </div>
  );
}
