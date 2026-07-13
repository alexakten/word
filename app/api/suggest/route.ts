type DatamuseSuggestion = { word: string };

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 60);
  if (!query || query.length < 2) return Response.json([]);

  try {
    const params = new URLSearchParams({ s: query, max: "7" });
    const response = await fetch(`https://api.datamuse.com/sug?${params}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error("Datamuse request failed");

    const results = (await response.json()) as DatamuseSuggestion[];
    return Response.json(results.map(({ word }) => word));
  } catch {
    return Response.json([], { status: 502 });
  }
}
