import type { Request, Response } from "express";
import { AccountService } from "../../services/account.service";

export class AccountController {
  private readonly accountService = new AccountService();

  async profile(req: Request, res: Response) {
    const data = await this.accountService.getProfile(req.session.user!);
    res.json({ data });
  }

  async updateProfile(req: Request, res: Response) {
    const data = await this.accountService.updateProfile(
      req.session.user!,
      req.body.data,
    );

    req.session.user = {
      ...req.session.user,
      id: data.id,
      email: data.email,
      name: data.fullName,
      role: data.role,
      customerId: data.customerId ?? null,
      photoUrl: data.photoUrl ?? null,
    };

    res.json({ data });
  }

  async changePassword(req: Request, res: Response) {
    const data = await this.accountService.changePassword(
      req.session.user!,
      req.body.data,
    );
    res.json({ data });
  }

  async orders(req: Request, res: Response) {
    const data = await this.accountService.listOrders(req.session.user!);
    res.json({ data });
  }
}
