import { HttpError } from "../utils/http-error";
import { EmailVerificationTokensRepository } from "../repositories/email-verification-tokens.repository";
import { UsersRepository } from "../repositories/users.repository";
import {
  createEmailVerificationToken,
  hashEmailVerificationToken,
} from "../utils/verification-token";
import { MailService } from "./mail.service";

function getAppOrigin() {
  return (
    process.env.APP_ORIGIN?.trim() ??
    process.env.VITE_APP_ORIGIN?.trim() ??
    "http://localhost:3000"
  );
}

export class EmailVerificationService {
  private readonly usersRepository = new UsersRepository();
  private readonly tokensRepository = new EmailVerificationTokensRepository();
  private readonly mailService = new MailService();

  async createAndSendForUser(input: {
    userId: string;
    email: string;
    fullName: string;
    purpose?: "signup" | "checkout";
  }) {
    await this.tokensRepository.invalidateByUserId(input.userId);
    const { token, tokenHash } = createEmailVerificationToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await this.tokensRepository.create({
      userId: input.userId,
      tokenHash,
      purpose: input.purpose ?? "signup",
      expiresAt,
    });

    const verificationUrl = `${getAppOrigin()}/verificar-email?token=${encodeURIComponent(token)}`;

    await this.mailService.sendEmailVerification({
      to: input.email,
      fullName: input.fullName,
      verificationUrl,
    });
  }

  async confirmToken(token: string) {
    const tokenHash = hashEmailVerificationToken(token.trim());
    const record = await this.tokensRepository.findActiveByTokenHash(tokenHash);

    if (!record) {
      throw new HttpError(400, "Token de verificacao invalido ou expirado.");
    }

    const user = await this.usersRepository.findById(record.userId);

    if (!user) {
      throw new HttpError(404, "Conta nao encontrada para este token.");
    }

    await this.usersRepository.update(user.id, {
      emailVerifiedAt: new Date(),
      isActive: true,
    });
    await this.tokensRepository.consume(record.id, new Date());

    return {
      email: user.email,
    };
  }

  async resendForEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email.trim().toLowerCase());

    if (!user) {
      throw new HttpError(404, "Nao existe cadastro com este e-mail.");
    }

    if (user.emailVerifiedAt) {
      throw new HttpError(400, "Este e-mail ja foi verificado.");
    }

    await this.createAndSendForUser({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      purpose: "signup",
    });

    return {
      email: user.email,
    };
  }
}
