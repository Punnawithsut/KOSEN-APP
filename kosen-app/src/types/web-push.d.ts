declare module "web-push" {
  export type PushSubscription = {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };

  const webPush: {
    setVapidDetails: (
      subject: string,
      publicKey: string,
      privateKey: string,
    ) => void;
    sendNotification: (
      subscription: PushSubscription,
      payload: string,
      options?: Record<string, unknown>,
    ) => Promise<void>;
  };

  export default webPush;
}
