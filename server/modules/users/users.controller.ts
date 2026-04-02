import type { Request, Response } from "express";
import { UsersService } from "../../services/users.service";

export class UsersController {
  private readonly usersService = new UsersService();

  async list(_req: Request, res: Response) {
    const data = await this.usersService.list();
    res.json({ data });
  }

  async detail(req: Request, res: Response) {
    const data = await this.usersService.getById(String(req.params.id));
    res.json({ data });
  }

  async create(req: Request, res: Response) {
    const data = await this.usersService.create(req.body.data);
    res.status(201).json({ data });
  }

  async update(req: Request, res: Response) {
    const data = await this.usersService.update(
      String(req.params.id),
      req.body.data,
    );
    res.json({ data });
  }

  async setActive(req: Request, res: Response) {
    const data = await this.usersService.setActiveStatus(
      String(req.params.id),
      Boolean(req.body.data.isActive),
    );
    res.json({ data });
  }

  async remove(req: Request, res: Response) {
    await this.usersService.setActiveStatus(String(req.params.id), false);
    res.status(204).end();
  }
}
