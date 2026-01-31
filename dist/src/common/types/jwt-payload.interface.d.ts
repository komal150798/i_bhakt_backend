export interface JwtPayload {
    sub: number;
    email?: string;
    phone_number?: string;
    role: string;
    type: 'user' | 'admin' | 'customer';
    iat?: number;
    exp?: number;
}
export interface CurrentUserPayload {
    id: number;
    unique_id?: string;
    email?: string;
    phone_number?: string;
    role: string;
    type: 'user' | 'admin' | 'customer';
}
