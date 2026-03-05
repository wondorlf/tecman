import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        console.log(`[Auth] Validating user: ${email}`);
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            console.log(`[Auth] User NOT found: ${email}`);
            return null;
        }

        const isMatch = await bcrypt.compare(pass, user.password);
        console.log(`[Auth] Password match for ${email}: ${isMatch}`);

        if (isMatch) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role.name };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role.name,
            },
        };
    }
}
