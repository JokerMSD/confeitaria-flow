import { HttpError } from "../utils/http-error";
import { CheckoutAccountRequestsRepository } from "../repositories/checkout-account-requests.repository";
import { UsersRepository } from "../repositories/users.repository";
import { UsersService } from "./users.service";
import { EmailVerificationService } from "./email-verification.service";
import { hashPassword } from "../utils/password";

export class CheckoutAccountRequestsService {
  private readonly checkoutAccountRequestsRepository =
    new CheckoutAccountRequestsRepository();
  private readonly usersRepository = new UsersRepository();
  private readonly usersService = new UsersService();
  private readonly emailVerificationService = new EmailVerificationService();

  async assertEmailAvailable(emailInput: string) {
    const email = emailInput.trim().toLowerCase();
    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new HttpError(
        400,
        "Ja existe uma conta com este e-mail. Use o login para acompanhar seus pedidos.",
      );
    }
  }

  async prepareForOrder(input: {
    orderId: string;
    email: string;
    fullName: string;
    customerId: string | null;
    password: string;
  }) {
    const email = input.email.trim().toLowerCase();
    await this.assertEmailAvailable(email);

    return this.checkoutAccountRequestsRepository.upsertByOrderId({
      orderId: input.orderId,
      email,
      fullName: input.fullName.trim(),
      customerId: input.customerId,
      passwordHash: await hashPassword(input.password),
    });
  }

  async processApprovedOrder(input: {
    orderId: string;
    customerId: string | null;
  }) {
    const request =
      await this.checkoutAccountRequestsRepository.findPendingByOrderId(
        input.orderId,
      );

    if (!request) {
      return null;
    }

    const existingUser = await this.usersRepository.findByEmail(request.email);

    if (existingUser) {
      await this.checkoutAccountRequestsRepository.markProcessed(
        request.id,
        new Date(),
      );

      return {
        email: existingUser.email,
        created: false,
      };
    }

    const user = await this.usersService.createVerifiedPendingPublicUser({
      email: request.email,
      fullName: request.fullName,
      passwordHash: request.passwordHash,
      customerId: request.customerId ?? input.customerId ?? null,
    });

    await this.emailVerificationService.createAndSendForUser({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      purpose: "checkout",
    });

    await this.checkoutAccountRequestsRepository.markProcessed(
      request.id,
      new Date(),
    );

    return {
      email: user.email,
      created: true,
    };
  }
}
