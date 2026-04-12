import type { Request, Response } from "express";
import { WhatsAppAssistantService } from "../../services/whatsapp-assistant.service";
import { HttpError } from "../../utils/http-error";

export class WhatsAppAssistantController {
  private readonly whatsappAssistantService = new WhatsAppAssistantService();

  async customerByPhone(req: Request, res: Response) {
    const data = await this.whatsappAssistantService.getCustomerByPhone(
      String(req.params.phone),
    );
    if (!data) {
      throw new HttpError(404, "Cliente nao encontrado para este telefone.");
    }
    res.json(data);
  }

  async upsertCustomer(req: Request, res: Response) {
    const data = await this.whatsappAssistantService.upsertCustomer(req.body);
    res.status(201).json(data);
  }

  async catalog(_req: Request, res: Response) {
    const data = await this.whatsappAssistantService.getCatalog();
    res.json(data);
  }

  async searchCatalog(req: Request, res: Response) {
    const data = await this.whatsappAssistantService.searchCatalog(
      String(req.query.q),
    );
    res.json(data);
  }

  async draftByPhone(req: Request, res: Response) {
    const data = await this.whatsappAssistantService.getDraftByPhone(
      String(req.params.phone),
    );
    res.json(data);
  }

  async upsertDraft(req: Request, res: Response) {
    const data = await this.whatsappAssistantService.upsertDraft(req.body);
    res.status(201).json(data);
  }

  async confirmDraft(req: Request, res: Response) {
    const data = await this.whatsappAssistantService.confirmDraft(req.body);
    res.json(data);
  }

  async ordersByPhone(req: Request, res: Response) {
    const data = await this.whatsappAssistantService.listOrdersByPhone(
      String(req.params.phone),
    );
    res.json(data);
  }

  async orderById(req: Request, res: Response) {
    const data = await this.whatsappAssistantService.getOrderById(
      String(req.params.id),
    );
    res.json(data);
  }

  async sessionByPhone(req: Request, res: Response) {
    const data = await this.whatsappAssistantService.getSessionStatus(
      String(req.params.phone),
    );
    res.json(data);
  }
}
