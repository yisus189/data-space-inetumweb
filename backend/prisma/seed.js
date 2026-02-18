import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Password en claro
  const plainPassword = 'operator123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Crear (o asegurar) operador aprobado
  const operator = await prisma.user.upsert({
    where: { email: 'operator@example.com' },
    update: {
      name: 'Operator Demo',
      country: 'España',
      city: 'Madrid',
      phone: '+34 600 000 000',
      role: Role.OPERATOR,
      status: UserStatus.ACTIVE,
      password: hashedPassword,
    },
    create: {
      name: 'Operator Demo',
      email: 'operator@example.com',
      country: 'España',
      city: 'Madrid',
      phone: '+34 600 000 000',
      role: Role.OPERATOR,
      status: UserStatus.ACTIVE,
      password: hashedPassword,
    },
  });

  console.log('Operador creado/actualizado:', operator.email);

  // (Opcional) Crear algunos usuarios pendientes de aprobación
  const providerPassword = await bcrypt.hash('provider123', 10);
  const consumerPassword = await bcrypt.hash('consumer123', 10);

  await prisma.user.upsert({
    where: { email: 'provider.demo@example.com' },
    update: {},
    create: {
      name: 'Provider Demo Pending',
      email: 'provider.demo@example.com',
      country: 'España',
      city: 'Barcelona',
      phone: '+34 611 111 111',
      role: Role.PROVIDER,
      status: UserStatus.PENDING,
      password: providerPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: 'consumer.demo@example.com' },
    update: {},
    create: {
      name: 'Consumer Demo Pending',
      email: 'consumer.demo@example.com',
      country: 'España',
      city: 'Valencia',
      phone: '+34 622 222 222',
      role: Role.CONSUMER,
      status: UserStatus.PENDING,
      password: consumerPassword,
    },
  });

  console.log('Usuarios demo PENDING creados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });