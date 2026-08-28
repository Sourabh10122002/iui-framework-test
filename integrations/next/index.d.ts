import type { NextConfig } from "next";

export interface IUIAdapterOptions {
  configPath?: string;
}

export default function withIUI(
  nextConfig?: NextConfig,
  options?: IUIAdapterOptions
): NextConfig;

