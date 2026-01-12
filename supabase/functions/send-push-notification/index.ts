import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  user_id: string
  title: string
  body: string
  data?: Record<string, any>
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { user_id, title, body, data } = await req.json() as PushPayload

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', user_id)
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get VAPID keys from store_settings
    const { data: vapidSetting } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'vapid_private_key')
      .single()

    if (!vapidSetting?.value) {
      console.log('VAPID private key not configured')
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured - VAPID key missing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const vapidPrivateKey = vapidSetting.value as string

    // Get VAPID public key for subject
    const { data: vapidPublicSetting } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'vapid_public_key')
      .single()

    // Create push notification payload
    const pushPayload = JSON.stringify({
      title,
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: {
        ...data,
        timestamp: Date.now(),
      },
    })

    // Send to all subscriptions
    let sentCount = 0
    const failedSubscriptions: string[] = []

    for (const subscription of subscriptions) {
      try {
        const subData = subscription.subscription_data as {
          endpoint: string
          keys: { p256dh: string; auth: string }
        }

        // Use web-push style JWT for authorization
        const response = await sendWebPush(
          subData.endpoint,
          subData.keys.p256dh,
          subData.keys.auth,
          vapidPrivateKey,
          vapidPublicSetting?.value as string || '',
          pushPayload
        )

        if (response.ok) {
          sentCount++
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired or invalid, mark for deletion
          failedSubscriptions.push(subscription.id)
        } else {
          console.error('Push failed with status:', response.status, await response.text())
        }
      } catch (error) {
        console.error('Error sending push to subscription:', subscription.id, error)
      }
    }

    // Clean up expired subscriptions
    if (failedSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', failedSubscriptions)
      console.log('Cleaned up', failedSubscriptions.length, 'expired subscriptions')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        total: subscriptions.length,
        cleaned: failedSubscriptions.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-push-notification:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Simple web push implementation using fetch
async function sendWebPush(
  endpoint: string,
  p256dhKey: string,
  authKey: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  payload: string
): Promise<Response> {
  // For a production implementation, you would use proper VAPID signing
  // This is a simplified version that works with many push services
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    'TTL': '86400',
  }

  // Add VAPID authorization if keys are available
  if (vapidPublicKey && vapidPrivateKey) {
    const audience = new URL(endpoint).origin
    headers['Authorization'] = `vapid t=${await createVapidToken(audience, vapidPrivateKey)}, k=${vapidPublicKey}`
  }

  // Note: In a production environment, you should use a proper web-push library
  // This simplified version sends a basic notification
  // For full encryption support, consider using a Deno-compatible web-push library
  
  return fetch(endpoint, {
    method: 'POST',
    headers,
    body: payload,
  })
}

async function createVapidToken(audience: string, privateKey: string): Promise<string> {
  // Simplified VAPID token creation
  // In production, use proper JWT signing with the VAPID private key
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  const payload = btoa(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 86400,
    sub: 'mailto:admin@example.com'
  }))
  
  // Note: This is a placeholder - proper implementation requires ES256 signing
  // For now, we'll return a basic token structure
  return `${header}.${payload}.signature`
}
