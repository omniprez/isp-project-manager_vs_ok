// src/scripts/updateBillingStatus.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCompletedProjectsBillingStatus() {
  try {
    // Find all completed projects with no billing status or 'Not Ready' billing status
    const completedProjects = await prisma.project.findMany({
      where: {
        status: 'Completed',
        OR: [
          { billingStatus: 'Not Ready' },
          { billingStatus: null }
        ]
      },
      include: {
        acceptanceForm: true
      }
    });

    console.log(`Found ${completedProjects.length} completed projects with billing status 'Not Ready' or null`);

    // Update each project's billing status to 'Pending'
    for (const project of completedProjects) {
      if (project.acceptanceForm) {
        await prisma.project.update({
          where: { id: project.id },
          data: { billingStatus: 'Pending' }
        });
        console.log(`Updated project ${project.id} (${project.projectName}) billing status to 'Pending'`);
      } else {
        console.log(`Project ${project.id} (${project.projectName}) has no acceptance form, skipping`);
      }
    }

    console.log('Billing status update completed successfully');
  } catch (error) {
    console.error('Error updating billing status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateCompletedProjectsBillingStatus();
