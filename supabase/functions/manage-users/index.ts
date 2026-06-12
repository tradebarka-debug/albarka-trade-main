import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Input validation constants
const VALID_ROLES = ['admin', 'user'] as const
const MAX_NAME_LENGTH = 100
const MIN_PASSWORD_LENGTH = 6
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Allowed origins for CORS - restrict to specific domains
const allowedOrigins = [
  'https://albarka-trade.lovable.app',
  'https://albarka-trade.com',
  'https://www.albarka-trade.com',
  'https://id-preview--fa0c5805-9cf6-47ce-a6c5-4200998b765e.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// Input validation function
function validateUserInput(data: { email?: string; password?: string; full_name?: string; role?: string }) {
  const errors: string[] = []
  
  if (data.email !== undefined) {
    if (typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email)) {
      errors.push('Invalid email format')
    }
    if (data.email.length > 255) {
      errors.push('Email too long')
    }
  }
  
  if (data.password !== undefined && data.password !== '') {
    if (typeof data.password !== 'string' || data.password.length < MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    }
    if (data.password.length > 128) {
      errors.push('Password too long')
    }
  }
  
  if (data.full_name !== undefined) {
    if (typeof data.full_name !== 'string') {
      errors.push('Invalid name format')
    } else if (data.full_name.length > MAX_NAME_LENGTH) {
      errors.push(`Name must be less than ${MAX_NAME_LENGTH} characters`)
    }
  }
  
  if (data.role !== undefined) {
    if (!VALID_ROLES.includes(data.role as typeof VALID_ROLES[number])) {
      errors.push('Invalid role')
    }
  }
  
  return errors
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a client with the user's token to verify their identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, ...params } = await req.json()

    switch (action) {
      case 'list': {
        // List all users with their roles
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          throw listError
        }

        // Get roles for all users
        const { data: roles, error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .select('user_id, role')

        if (rolesError) {
          throw rolesError
        }

        // Merge users with their roles
        const usersWithRoles = users.map(u => ({
          id: u.id,
          email: u.email,
          full_name: u.user_metadata?.full_name || '',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          role: roles.find(r => r.user_id === u.id)?.role || 'user'
        }))

        return new Response(
          JSON.stringify({ users: usersWithRoles }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create': {
        const { email, password, full_name, role } = params

        // Validate all inputs before creating user
        const validationErrors = validateUserInput({ email, password, full_name, role })
        if (validationErrors.length > 0) {
          return new Response(
            JSON.stringify({ error: validationErrors.join(', ') }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create the user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name }
        })

        if (createError) {
          throw createError
        }

        // If role is admin, update the user_roles table
        if (role === 'admin' && newUser.user) {
          const { error: roleUpdateError } = await supabaseAdmin
            .from('user_roles')
            .update({ role: 'admin' })
            .eq('user_id', newUser.user.id)

          if (roleUpdateError) {
            console.error('Error updating role:', roleUpdateError)
          }
        }

        return new Response(
          JSON.stringify({ user: newUser.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update': {
        const { userId, email, password, full_name, role } = params

        // Validate provided fields only
        const fieldsToValidate: { email?: string; password?: string; full_name?: string; role?: string } = {}
        if (email !== undefined) fieldsToValidate.email = email
        if (password !== undefined) fieldsToValidate.password = password
        if (full_name !== undefined) fieldsToValidate.full_name = full_name
        if (role !== undefined) fieldsToValidate.role = role

        const validationErrors = validateUserInput(fieldsToValidate)
        if (validationErrors.length > 0) {
          return new Response(
            JSON.stringify({ error: validationErrors.join(', ') }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const updateData: any = {
          user_metadata: { full_name }
        }

        if (email) updateData.email = email
        if (password) updateData.password = password

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          updateData
        )

        if (updateError) {
          throw updateError
        }

        // Update role if provided
        if (role) {
          const { error: roleUpdateError } = await supabaseAdmin
            .from('user_roles')
            .update({ role })
            .eq('user_id', userId)

          if (roleUpdateError) {
            console.error('Error updating role:', roleUpdateError)
          }
        }

        return new Response(
          JSON.stringify({ user: updatedUser.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete': {
        const { userId } = params

        // Prevent self-deletion
        if (userId === user.id) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete your own account' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
          throw deleteError
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})