import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS Handler (Para o caso de precisar)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get("x-kiwify-signature")
    // Se quiser adicionar validação de segurança da assinatura da Kiwify, faça aqui:
    // https://kiwify.com.br/docs/webhooks

    const payload = await req.json()
    console.log("Recebido Webhook da Kiwify:", payload)

    // Apenas se importar com vendas aprovadas
    if (payload.order_status !== 'paid') {
      return new Response(JSON.stringify({ status: 'ignored', message: 'Not a paid order' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const email = payload.Customer?.email
    const name = payload.Customer?.full_name

    if (!email) {
      throw new Error("Missing email in payload")
    }

    // Inicializa o cliente do Supabase
    // Usa a Service Role Key para ter acesso de admin (criar usuários)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Tentar criar usuário usando o método admin (senha genérica temporária ou acesso magic link)
    // Para simplificar: Pega a senha que o usuário colocou no checkout, 
    // ou se a Kiwify não manda senha, usa um Padrão (Ex: Escudo123!)
    const tempPassword = "EscudoLuz" + Math.floor(Math.random() * 10000)

    console.log(`Tentando criar usuário para ${email}`)

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        source: 'kiwify'
      }
    })

    if (error) {
      if (error.status === 422 && error.message.includes('already been registered')) {
        console.log(`Usuário ${email} já existe. Ignorando criação na auth.`)
        // Opcional: Atualizar a tabela de perfis caso queira reviver o acesso
      } else {
        throw error
      }
    } else {
      console.log(`Usuário ${email} criado com sucesso! Enviar e-mail: Supabase já cuida de 'Welcome Email' se configurado.`)
    }

    // 💡 NOTA: A Trigger que criamos antes (on_escudo_auth_user_created) 
    // vai inserir automaticamente esse novo usuário na tabela `escudo_profiles`.

    return new Response(
      JSON.stringify({ status: 'success', email: email }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
    )

  } catch (error) {
    console.error("Erro no Webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
