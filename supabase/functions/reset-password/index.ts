import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { access_token, refresh_token, new_password } = await req.json()
    
    if (!access_token || !refresh_token || !new_password) {
      throw new Error('Missing required parameters')
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First, verify the tokens by setting the session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.setSession({
      access_token,
      refresh_token
    })

    if (sessionError || !sessionData.session) {
      console.error('Session error:', sessionError)
      throw new Error('Invalid or expired reset tokens')
    }

    // Update the user's password using the admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      sessionData.session.user.id,
      { password: new_password }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      throw new Error('Failed to update password')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Reset password error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to reset password' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})