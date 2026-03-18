"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Key, CheckCircle, XCircle } from "lucide-react";

type Provider = "anthropic" | "gemini" | "openai";

interface ApiConfig {
  name: string;
  endpoint: string;
  headers: Record<string, string>;
  requestBody: (prompt: string, apiKey: string) => object;
  parseResponse: (data: any) => string;
}

const apiConfigs: Record<Provider, ApiConfig> = {
  anthropic: {
    name: "Anthropic",
    endpoint: "https://api.anthropic.com/v1/messages",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "",
      "anthropic-version": "2023-06-01",
    },
    requestBody: (prompt, apiKey) => ({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
    parseResponse: (data) => data.content?.[0]?.text || JSON.stringify(data),
  },
  gemini: {
    name: "Google Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    headers: {
      "Content-Type": "application/json",
    },
    requestBody: (prompt, apiKey) => ({
      contents: [{ parts: [{ text: prompt }] }],
    }),
    parseResponse: (data) => {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
    },
  },
  openai: {
    name: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: "",
    },
    requestBody: (prompt, apiKey) => ({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || JSON.stringify(data),
  },
};

export default function ApiTesterPage() {
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider, apiKey, prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold">
                API{" "}
                <span className="gradient-text">Tester</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Test your API keys from major providers. Get instant results from Anthropic, Gemini, or OpenAI.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">API Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider)}
                  className="w-full bg-secondary/50 border border-gray-700 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI (GPT-4)</option>
                </select>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  API Key <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Paste your ${apiConfigs[provider].name} API key`}
                    required
                    className="w-full bg-secondary/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Query <span className="text-primary">*</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What would you like to ask?"
                  required
                  rows={4}
                  className="w-full bg-secondary/50 border border-gray-700 rounded-xl px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !apiKey || !prompt}
                className="w-full bg-primary hover:bg-accent disabled:bg-gray-600 disabled:cursor-not-allowed text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Results */}
            {(result || error) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card p-8 rounded-2xl ${error ? "border border-red-500/30" : "border border-primary/30"}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {error ? (
                    <XCircle className="w-6 h-6 text-red-400" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-primary" />
                  )}
                  <h2 className="text-2xl font-bold">{error ? "Error" : "Result"}</h2>
                </div>
                
                <div className="bg-background/50 rounded-xl p-6 max-h-96 overflow-y-auto">
                  {error ? (
                    <p className="text-red-400 font-mono text-sm">{error}</p>
                  ) : (
                    <pre className="text-foreground font-mono text-sm whitespace-pre-wrap">
                      {result}
                    </pre>
                  )}
                </div>
              </motion.div>
            )}

            {/* Quick Tests */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Test Prompts</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Explain quantum computing in simple terms",
                  "Write a haiku about coding",
                  "What's the capital of France?",
                  "Debug this Python code: print('hello'",
                ].map((testPrompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(testPrompt)}
                    className="glass-card hover:bg-secondary/50 px-4 py-3 rounded-xl text-left text-sm transition-all"
                  >
                    {testPrompt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
