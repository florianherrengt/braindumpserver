export interface AppContext {
    user?: { username: string };
}

export const createContext = ({ username }: { username: string }) => {
    const context = {};
    if (username) {
        Object.assign(context, { user: { username, role: 1 } });
    }
    return context;
};
