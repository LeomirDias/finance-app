export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function getInitials(name?: string | null): string {
  if (!name) return "JF";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getFirstName(name?: string | null): string {
  if (!name) return "Usuário";
  return name.split(" ")[0] ?? name;
}
