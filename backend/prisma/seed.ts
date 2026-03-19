import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin users
  const passwordHash = await bcrypt.hash('Dron3120@', 12);

  const admin1 = await prisma.user.upsert({
    where: { email: 'victorcesar2031@gmail.com' },
    update: {},
    create: {
      email: 'victorcesar2031@gmail.com',
      password: passwordHash,
      name: 'Victor Cesar',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'thallesaguiar@outlook.com.br' },
    update: {},
    create: {
      email: 'thallesaguiar@outlook.com.br',
      password: passwordHash,
      name: 'Thalles Aguiar',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Admin users created:', admin1.email, admin2.email);

  // Create default asset categories
  const categories = [
    { name: 'Computadores & TI', description: 'Desktops, notebooks, servidores', icon: '💻', color: '#3B82F6' },
    { name: 'Móveis', description: 'Mesas, cadeiras, armários', icon: '🪑', color: '#8B5CF6' },
    { name: 'Veículos', description: 'Carros, motos, caminhões', icon: '🚗', color: '#EF4444' },
    { name: 'Equipamentos', description: 'Máquinas, ferramentas, instrumentos', icon: '🔧', color: '#F59E0B' },
    { name: 'Eletrônicos', description: 'TVs, projetores, sistemas de som', icon: '📺', color: '#10B981' },
    { name: 'Imóveis', description: 'Prédios, terrenos, salas', icon: '🏢', color: '#6366F1' },
  ];

  for (const cat of categories) {
    await prisma.assetCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log('✅ Default categories created');

  // Create default locations
  const locations = [
    { name: 'Sede Principal', description: 'Escritório principal da empresa' },
    { name: 'Almoxarifado', description: 'Depósito de materiais e equipamentos' },
    { name: 'Sala de TI', description: 'Departamento de tecnologia' },
    { name: 'Recepção', description: 'Área de recepção e atendimento' },
    { name: 'Sala de Reuniões', description: 'Espaço para reuniões e apresentações' },
  ];

  for (const loc of locations) {
    await prisma.assetLocation.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    });
  }

  console.log('✅ Default locations created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
