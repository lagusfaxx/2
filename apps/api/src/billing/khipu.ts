import fetch from "node-fetch";
import { env } from "../lib/env";

const KHIPU_BASE_URL = "https://payment-api.khipu.com";

const headers = () => ({
  "Content-Type": "application/json",
  "x-api-key": env.KHIPU_API_KEY ?? ""
});

export type KhipuSubscriptionPayload = {
  name: string;
  email: string;
  max_amount: number;
  currency: string;
  notify_url: string;
  return_url: string;
  cancel_url: string;
};

export const createSubscription = async (payload: KhipuSubscriptionPayload) => {
  const response = await fetch(`${KHIPU_BASE_URL}/v1/automatic-payment/subscription`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Khipu subscription failed: ${await response.text()}`);
  }

  return response.json();
};

export const getSubscriptionStatus = async (subscriptionId: string) => {
  const response = await fetch(`${KHIPU_BASE_URL}/v1/automatic-payment/subscription/${subscriptionId}`, {
    headers: headers()
  });

  if (!response.ok) {
    throw new Error(`Khipu status failed: ${await response.text()}`);
  }

  return response.json();
};

export const createChargeIntent = async (payload: Record<string, unknown>) => {
  const response = await fetch(`${KHIPU_BASE_URL}/v1/automatic-payment/charge-intent`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Khipu charge intent failed: ${await response.text()}`);
  }

  return response.json();
};
