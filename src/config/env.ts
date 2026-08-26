const required = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`${name} eksik. .env dosyanizi kontrol edin.`);
  return value;
};

export const env = {
  aiProxyUrl: () => required(process.env.EXPO_PUBLIC_AI_PROXY_URL, 'EXPO_PUBLIC_AI_PROXY_URL'),
  appSecret: () => process.env.EXPO_PUBLIC_APP_SECRET,
};
