import { LLMProviderConfig } from '../types';

export interface OllamaConfig extends LLMProviderConfig {
  baseURL?: string;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  temperature?: number;
  stream?: boolean;
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
  load_duration?: number;
  prompt_duration?: number;
  total_duration?: number;
} 