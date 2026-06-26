import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ReclamacionesModule } from './reclamaciones/reclamaciones.module';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'mail.myec.website',
        port: 465,
        secure: true,
        auth: {
          user: 'contacto@myec.website',
          pass: 'mattinnovasolution123',
        },
      },
      defaults: {
        from: '"Matt Innova Solution" <contacto@myec.website>',
      },
    }),
    ChatbotModule,
    ReclamacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
