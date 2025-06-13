
import { AuthUser } from '@/types/auth';

export class AuthStorage {
  static setAuthUser(user: AuthUser): void {
    localStorage.setItem('authUser', JSON.stringify(user));
  }

  static getAuthUser(): AuthUser | null {
    try {
      const userStr = localStorage.getItem('authUser');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static setInstanceId(instanceId: string): void {
    localStorage.setItem('instanceId', instanceId);
  }

  static getInstanceId(): string | null {
    return localStorage.getItem('instanceId');
  }

  static clearAuth(): void {
    localStorage.removeItem('authUser');
    localStorage.removeItem('instanceId');
  }

  static updateUserProfile(userData: AuthUser): void {
    localStorage.setItem('authUser', JSON.stringify(userData));
  }
}
