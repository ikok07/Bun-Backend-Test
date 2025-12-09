import jwt from "jsonwebtoken"

export class JwtService {
    static generateToken(payload: object, expiresIn?: number) {
        if (!process.env.JWT_SECRET) throw new Error("JWT Secret not found!");
        return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn});
    }

    static verifyToken(token: string) {
        if (!process.env.JWT_SECRET) throw new Error("JWT Secret not found!");
        return jwt.verify(token, process.env.JWT_SECRET);
    }
}