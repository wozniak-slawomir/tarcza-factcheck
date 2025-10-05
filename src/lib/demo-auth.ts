export const DEMO_AUTH_STORAGE_KEY = "demo-auth-state";

export type DemoAuthPayload = {
    loggedIn: true;
    verifiedAt: string;
};

export function persistDemoAuth(): void {
    if (typeof window === "undefined") return;
    const payload: DemoAuthPayload = {
        loggedIn: true,
        verifiedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function clearDemoAuth(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
}

export function isDemoAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    const value = window.localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
    if (!value) return false;

    try {
        const parsed = JSON.parse(value) as DemoAuthPayload;
        return parsed.loggedIn === true;
    } catch {
        window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
        return false;
    }
}
