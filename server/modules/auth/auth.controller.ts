import type { Request, Response } from "express";
import { AuthService } from "./auth.service";

const sessionCookieName = "confeitaria.sid";

export class AuthController {
  private readonly authService = new AuthService();

  async login(req: Request, res: Response) {
    const user = await this.authService.login(req.body.data);

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) {
          reject(error);
          return;
        }

        req.session.user = user;
        req.session.save((saveError) => {
          if (saveError) {
            reject(saveError);
            return;
          }

          resolve();
        });
      });
    });

    res.json({ data: user });
  }

  async register(req: Request, res: Response) {
    const result = await this.authService.register(req.body.data);
    res.status(201).json({ data: result });
  }

  async verifyEmail(req: Request, res: Response) {
    const result = await this.authService.verifyEmail(req.body.data);
    res.json({ data: { ok: true, email: result.email } });
  }

  async resendVerificationEmail(req: Request, res: Response) {
    const result = await this.authService.resendVerificationEmail(req.body.data);
    res.json({ data: { ok: true, email: result.email } });
  }

  async me(req: Request, res: Response) {
    if (!req.session.user) {
      res.status(401).json({ message: "Not authenticated." });
      return;
    }

    res.json({ data: req.session.user });
  }

  async logout(req: Request, res: Response) {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    res.clearCookie(sessionCookieName);
    res.json({ data: { ok: true } });
  }
}
