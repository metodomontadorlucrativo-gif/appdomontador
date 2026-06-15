## Problema

A área `/admin` existe e o papel está correto no banco, mas o admin (metodomontadorlucrativo@gmail.com) está com o trial expirado, então ao logar é levado para `/app` e imediatamente redirecionado para `/planos`, sem nunca conseguir entrar em `/admin`. Além disso, não existe nenhum link/botão visível para o admin acessar a área.

## Correções

1. **`src/hooks/use-auth.ts`** — incluir checagem de papel admin no hook, expondo `isAdmin` (e `roleLoading`) para evitar repetir a query em cada tela. Usa `supabase.from("user_roles").select("role").eq("user_id", user.id)`.

2. **`src/routes/app.tsx`** — quando `isAdmin === true`, pular o redirect para `/planos` mesmo com trial expirado (admin testa o app livremente). Adicionar botão "Admin" no header (só renderiza se `isAdmin`).

3. **`src/routes/planos.tsx`** — adicionar botão "Ir para Admin" no topo quando `isAdmin`, para o admin sair da tela sem precisar assinar.

4. **`src/routes/login.tsx`** — após login bem-sucedido, se o usuário for admin redirecionar para `/admin`; senão `/app` (comportamento atual).

5. **`src/routes/admin.tsx`** — simplificar: usar `isAdmin` do hook (remove a query duplicada e o flicker), mantendo o painel atual.

6. **Migração leve** — atualizar o perfil do admin para `subscription_status = 'active'` e `plan = 'infinit'` no banco, garantindo que mesmo sem a lógica nova ele nunca seja bloqueado por trial. (Não cria tabela, só `UPDATE` via insert tool.)

## Resultado

- Login com `metodomontadorlucrativo@gmail.com` → vai direto para `/admin`.
- Botão "Admin" aparece no header do `/app` e no topo do `/planos` para esse usuário.
- Demais usuários continuam com o fluxo normal (trial → planos).