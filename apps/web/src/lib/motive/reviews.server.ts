import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import {
  buildReviewRpcArgs,
  type ReviewActionInput,
  type ReviewActionResult
} from "./reviews";

type SupabaseError = {
  code?: string;
  message: string;
};

type SupabaseRpcClient = {
  rpc(
    functionName: string,
    args: Record<string, unknown>
  ): Promise<{ data: unknown; error: SupabaseError | null }>;
};

export function createSupabaseReviewRepository() {
  const supabase = createSupabaseServiceRoleClient() as unknown as SupabaseRpcClient;

  return {
    async reviewEntity(input: ReviewActionInput): Promise<ReviewActionResult> {
      const { data, error } = await supabase.rpc("review_entity_action", buildReviewRpcArgs(input));
      if (error) throw error;
      return data as ReviewActionResult;
    }
  };
}
