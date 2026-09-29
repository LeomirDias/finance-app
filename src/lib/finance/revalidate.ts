import { revalidatePath } from "next/cache";

export function revalidateFinance() {
  revalidatePath("/");
  revalidatePath("/ganhos");
  revalidatePath("/gastos");
  revalidatePath("/assinaturas");
  revalidatePath("/recorrentes");
  revalidatePath("/parcelamentos");
  revalidatePath("/cartoes");
  revalidatePath("/cartoes/[cardId]", "page");
  revalidatePath("/categorias");
}
