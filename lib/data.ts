import { getSupabaseClient } from "./supabase";
import type { Barber, Service } from "@/types/db";

export async function getServices(): Promise<Service[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true });

  return (data ?? []) as Service[];
}

export async function getBarbers(): Promise<Barber[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("barbers")
    .select("*")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  return (data ?? []) as Barber[];
}
