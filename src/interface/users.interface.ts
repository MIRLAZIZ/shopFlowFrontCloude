export interface User {
    fullName: string | null;
    username: string | null;
    password: string | null;
    brandName: string | null;
    role: string | null;
    phone: string | null;
    // telegramId: number | null;
    // telegramGroupId: string | null;

}


export interface UserData {
    id: number;
    username: string;
    phone: string | null;
    role: string;
}



export interface ResponseUser {
    id: number;
    fullName: string;
    username: string;
    password: string;
    brandName: string;
    role: string;
    createdAt: string;
    subscriptionStatus: string;
    expiryDate: string;
    lastPaymentAt: string | null;
    manualExtensionCount: number;
    adminNote: string | null;
    debtAmount: string;
    phone: string;
    telegramId: string | null;
    telegramGroupId: string | null;
}
