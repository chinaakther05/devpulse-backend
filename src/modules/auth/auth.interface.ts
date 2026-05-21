export interface IUser {
    id? : number;
    name: string;
    email: string;
    password?: string;
    role: 'contributor' | 'maintainer';
    created_at?: Date;
    updated_at?: Date;
}


export interface TJwtPayload{
    id: number;
    name: string;
    role: 'contributor' | 'maintainer';
}