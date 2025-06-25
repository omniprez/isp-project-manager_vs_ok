// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');
  
  // Create test users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const salesPassword = await bcrypt.hash('sales123', 10);
  
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin user: ${admin.name} (${admin.email})`);
  
  // Create sales user
  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@example.com' },
    update: {},
    create: {
      email: 'sales@example.com',
      name: 'Sales User',
      password: salesPassword,
      role: Role.SALES,
    },
  });
  console.log(`Created sales user: ${salesUser.name} (${salesUser.email})`);
  
  // Create a test project
  const project = await prisma.project.upsert({
    where: { projectName: 'Test Project' },
    update: {},
    create: {
      projectName: 'Test Project',
      status: 'Draft',
      customerName: 'Test Customer',
      salesPersonId: salesUser.id,
      crd: {
        create: {
          projectType: 'Internet',
          billingTrigger: 'Acceptance',
          serviceType: 'Dedicated',
          bandwidth: '100 Mbps',
          redundancy: false,
        },
      },
    },
    include: {
      crd: true,
    },
  });
  console.log(`Created test project: ${project.projectName}`);
  
  // Create another test project with different status
  const project2 = await prisma.project.upsert({
    where: { projectName: 'Pending Approval Project' },
    update: {},
    create: {
      projectName: 'Pending Approval Project',
      status: 'Pending Approval',
      customerName: 'Another Customer',
      salesPersonId: salesUser.id,
      crd: {
        create: {
          projectType: 'MPLS',
          billingTrigger: 'Installation',
          serviceType: 'Shared',
          bandwidth: '50 Mbps',
          redundancy: true,
        },
      },
    },
    include: {
      crd: true,
    },
  });
  console.log(`Created test project: ${project2.projectName}`);
  
  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
