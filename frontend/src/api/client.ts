const API = "/api";

export type ClientProfile = {
  id: number;
  name: string;
  email: string | null;
  goal: string;
  target_calories: number | null;
  target_protein_g: number | null;
  dietary_restrictions: string | null;
  allergies: string | null;
  training_phase: string | null;
  recovery_preferences: string | null;
  extra_context: string | null;
  created_at: string;
};

export type MealItem = { name: string; calories?: number; protein_g?: number };
export type MealLogEntry = {
  id: number;
  client_id: number;
  logged_at: string;
  meal_type: string;
  items: string;
  source: string;
};

export async function listClients(): Promise<ClientProfile[]> {
  const r = await fetch(`${API}/nutrition/clients`);
  if (!r.ok) throw new Error("Failed to fetch clients");
  return r.json();
}

export async function createClient(body: Partial<ClientProfile>): Promise<ClientProfile> {
  const r = await fetch(`${API}/nutrition/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Failed to create client");
  return r.json();
}

export async function getClient(id: number): Promise<ClientProfile> {
  const r = await fetch(`${API}/nutrition/clients/${id}`);
  if (!r.ok) throw new Error("Client not found");
  return r.json();
}

export async function logMeal(clientId: number, mealType: string, items: MealItem[]): Promise<MealLogEntry> {
  const r = await fetch(`${API}/nutrition/meals/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, meal_type: mealType, items }),
  });
  if (!r.ok) throw new Error("Failed to log meal");
  return r.json();
}

export async function logMealImage(clientId: number, mealType: string, file: File): Promise<MealLogEntry> {
  const form = new FormData();
  form.append("client_id", String(clientId));
  form.append("meal_type", mealType);
  form.append("file", file);
  const r = await fetch(`${API}/nutrition/meals/log-image`, { method: "POST", body: form });
  if (!r.ok) throw new Error("Failed to log meal from image");
  return r.json();
}

export async function listMeals(clientId?: number): Promise<MealLogEntry[]> {
  const q = clientId != null ? `?client_id=${clientId}` : "";
  const r = await fetch(`${API}/nutrition/meals${q}`);
  if (!r.ok) throw new Error("Failed to fetch meals");
  return r.json();
}

export async function coachChat(clientId: number, message: string): Promise<{ reply: string; sources: { content: string }[] }> {
  const r = await fetch(`${API}/coach/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, message }),
  });
  if (!r.ok) throw new Error("Failed to get reply");
  return r.json();
}

export async function getMealPlan(clientId: number, days: number = 7, focus?: string) {
  const r = await fetch(`${API}/coach/meal-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, days, focus }),
  });
  if (!r.ok) throw new Error("Failed to get meal plan");
  return r.json();
}

export async function getSupplementSuggestions(clientId: number, goal?: string) {
  const r = await fetch(`${API}/coach/supplements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, goal }),
  });
  if (!r.ok) throw new Error("Failed to get suggestions");
  return r.json();
}

export async function getRecoveryProtocols(clientId: number, context?: string) {
  const r = await fetch(`${API}/coach/recovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, context }),
  });
  if (!r.ok) throw new Error("Failed to get protocols");
  return r.json();
}

export async function ingestDocs(): Promise<{ ingested_chunks: number }> {
  const r = await fetch(`${API}/coach/ingest`, { method: "POST" });
  if (!r.ok) throw new Error("Ingest failed");
  return r.json();
}
