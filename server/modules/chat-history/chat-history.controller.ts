import type { Request, Response } from "express";
import { ChatHistoryService } from "../../services/chat-history.service";

export class ChatHistoryController {
  private readonly service = new ChatHistoryService();

  async saveMessage(req: Request, res: Response) {
    const data = await this.service.saveMessage(req.body);
    res.status(201).json(data);
  }

  async getRecentMessages(req: Request, res: Response) {
    const data = await this.service.getRecentMessages(
      String(req.params.customerPhone),
      typeof req.query.limit === "number"
        ? req.query.limit
        : typeof req.query.limit === "string"
          ? Number(req.query.limit)
          : undefined,
    );
    res.json(data);
  }

  async getConversationContext(req: Request, res: Response) {
    const data = await this.service.getConversationContext(
      String(req.params.customerPhone),
      typeof req.query.limit === "number"
        ? req.query.limit
        : typeof req.query.limit === "string"
          ? Number(req.query.limit)
          : undefined,
    );
    res.json(data);
  }
}
