// A slimmed down version of the internal error type from @firebase/firestore
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

const FIRESTORE_PERMISSION_ERROR_NAME = 'FirestorePermissionError';

export class FirestorePermissionError extends Error {
  public readonly context;

  constructor(context: SecurityRuleContext) {
    const { path, operation, requestResourceData } = context;

    const request = {
      // In a real app, you'd want to get the user's auth context here.
      // For this demo, we'll keep it simple.
      auth: {
        uid: '(unknown: use a real auth provider)',
        token: {},
      },
      method: operation,
      path: `/databases/(default)/documents/${path}`,
      ...(requestResourceData && { resource: { data: requestResourceData } }),
    };

    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
      request,
      null,
      2
    )}`;

    super(message);
    this.name = FIRESTORE_PERMISSION_ERROR_NAME;
    this.context = context;

    // This is to ensure the stack trace is correct
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
