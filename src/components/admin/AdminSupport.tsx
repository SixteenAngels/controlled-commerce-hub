import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, MessageCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export function AdminSupport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Get unique users who have sent messages
  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          user_id,
          profiles:user_id(name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get unique users
      const uniqueUsers = new Map();
      data?.forEach((msg) => {
        if (!uniqueUsers.has(msg.user_id)) {
          uniqueUsers.set(msg.user_id, msg.profiles);
        }
      });
      
      return Array.from(uniqueUsers.entries()).map(([userId, profile]) => ({
        user_id: userId,
        profile,
      }));
    },
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['admin-messages', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', selectedUserId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUserId,
  });

  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId || !replyMessage.trim() || !user) return;
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: selectedUserId,
          admin_id: user.id,
          message: replyMessage,
          is_from_admin: true,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages', selectedUserId] });
      setReplyMessage('');
      toast.success('Reply sent');
    },
    onError: (error) => {
      toast.error('Failed to send reply');
      console.error(error);
    },
  });

  if (loadingConversations) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-serif">Support</h1>
        <Badge variant="outline">
          {conversations?.length || 0} Conversations
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {conversations?.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  No conversations yet
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {conversations?.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => setSelectedUserId(conv.user_id)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedUserId === conv.user_id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {(conv.profile as any)?.name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(conv.profile as any)?.email}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {selectedUserId ? 'Chat' : 'Select a conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedUserId ? (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Select a conversation to view messages
              </div>
            ) : loadingMessages ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_from_admin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.is_from_admin
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.is_from_admin ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Type a reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReplyMutation.mutate();
                      }
                    }}
                  />
                  <Button 
                    onClick={() => sendReplyMutation.mutate()}
                    disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
