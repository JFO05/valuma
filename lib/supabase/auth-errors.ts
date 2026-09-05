/**
 * Traduz mensagens de erro do Supabase Auth para algo amigável em pt-BR.
 * Faz match por substring porque o supabase-js não expõe um enum estável
 * de mensagens (o `code` estruturado só existe em algumas versões da API).
 */
export function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de fazer login.";
  }
  if (normalized.includes("user already registered")) {
    return "Já existe uma conta com este e-mail.";
  }
  if (normalized.includes("password should be at least")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}
