export interface AuthenticationData {
    accessToken: string;
    idToken: string;
    userId: string;
    customToken: string;
    carrierDetails?: string;
}

export interface LoginParams {
    message: AuthenticationData;
}
