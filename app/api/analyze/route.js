import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildAnalysisPrompt, getPromptHash } from '@/lib/analysis-prompt';

// Supabase admin client for server-side cache operations
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { prompt, messages, system, listingId, listing, price, dom, force } = body;

  // If listing data provided, use enhanced prompt
  const useEnhanced = listing && listingId;
  let finalSystem, finalMessages;

  if (useEnhanced) {
    const analysis = buildAnalysisPrompt(listing);
    finalSystem = analysis.system;
    finalMessages = [{ role: 'user', content: analysis.user }];
  } else {
    finalSystem = system || undefined;
    finalMessages = messages || [{ role: 'user', content: prompt || '' }];
  }

  // Check cache (only for enhanced/listing-based requests)
  const supabase = getSupabase();
  const promptHash = getPromptHash();

  if (supabase && listingId && !force) {
    try {
      const { data: cached } = await supabase
        .from('analysis_cache')
        .select('analysis_text, price_at_analysis, prompt_hash')
        .eq('listing_id', listingId)
        .single();

      if (cached && cached.prompt_hash === promptHash && cached.price_at_analysis === (price || listing?.price)) {
        return NextResponse.json({
          content: [{ text: cached.analysis_text }],
          cached: true,
        });
      }
    } catch {
      // Cache miss or table doesn't exist — continue to API call
    }
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        ...(finalSystem ? { system: finalSystem } : {}),
        messages: finalMessages,
      }),
    });

    const data = await response.json();

    // Cache the response
    if (supabase && listingId && data?.content?.[0]?.text) {
      try {
        await supabase.from('analysis_cache').upsert({
          listing_id: listingId,
          analysis_text: data.content[0].text,
          prompt_hash: promptHash,
          price_at_analysis: price || listing?.price || 0,
          dom_at_analysis: dom || listing?.dom || 0,
        });
      } catch {
        // Cache write failure is non-critical
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed', detail: error.message }, { status: 500 });
  }
}
