import { MongoClient, Db, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'projectpulse';

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  const client = await MongoClient.connect(MONGODB_URI);
  const db: Db = client.db(MONGODB_DB_NAME);

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('projects').deleteMany({});
    await db.collection('checkIns').deleteMany({});
    await db.collection('feedback').deleteMany({});
    await db.collection('risks').deleteMany({});
    await db.collection('activityLogs').deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create Users
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin@123', 10);
    const hashedEmployeePassword = await bcrypt.hash(process.env.SEED_EMPLOYEE_PASSWORD || 'Employee@123', 10);
    const hashedClientPassword = await bcrypt.hash(process.env.SEED_CLIENT_PASSWORD || 'Client@123', 10);

    const users = [
      {
        email: 'admin@projectpulse.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'employee@projectpulse.com',
        password: hashedEmployeePassword,
        name: 'John Developer',
        role: 'employee',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'employee2@projectpulse.com',
        password: hashedEmployeePassword,
        name: 'Sarah Engineer',
        role: 'employee',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'client@projectpulse.com',
        password: hashedClientPassword,
        name: 'Client Representative',
        role: 'client',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'client2@projectpulse.com',
        password: hashedClientPassword,
        name: 'Another Client',
        role: 'client',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const userResult = await db.collection('users').insertMany(users);
    const userIds = Object.values(userResult.insertedIds);
    console.log(`✅ Created ${userIds.length} users\n`);

    const [adminId, employee1Id, employee2Id, client1Id, client2Id] = userIds;

    // Create Projects
    console.log('📁 Creating projects...');
    const projects = [
      {
        name: 'E-Commerce Platform Redesign',
        description: 'Complete overhaul of the company e-commerce platform with modern UI/UX and improved performance',
        clientId: client1Id,
        employeeIds: [employee1Id, employee2Id],
        startDate: new Date('2024-11-01'),
        endDate: new Date('2025-03-01'),
        status: 'On Track',
        healthScore: 85,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Mobile App Development',
        description: 'Native mobile application for iOS and Android with real-time synchronization',
        clientId: client1Id,
        employeeIds: [employee1Id],
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-04-30'),
        status: 'At Risk',
        healthScore: 68,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'CRM System Integration',
        description: 'Integration of third-party CRM system with existing infrastructure',
        clientId: client2Id,
        employeeIds: [employee2Id],
        startDate: new Date('2024-10-15'),
        endDate: new Date('2025-02-15'),
        status: 'Critical',
        healthScore: 52,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const projectResult = await db.collection('projects').insertMany(projects);
    const projectIds = Object.values(projectResult.insertedIds);
    console.log(`✅ Created ${projectIds.length} projects\n`);

    // Create Check-ins
    console.log('📝 Creating check-ins...');
    const checkIns = [
      // Project 1 - Week 1
      {
        projectId: projectIds[0],
        employeeId: employee1Id,
        weekStartDate: new Date('2024-12-16'),
        progressSummary: 'Completed initial design mockups and started frontend implementation',
        blockers: 'Waiting for client approval on final design',
        confidenceLevel: 4,
        completionPercentage: 35,
        createdAt: new Date('2024-12-17'),
      },
      // Project 1 - Week 2
      {
        projectId: projectIds[0],
        employeeId: employee1Id,
        weekStartDate: new Date('2024-12-09'),
        progressSummary: 'Implemented shopping cart functionality and product listings',
        blockers: '',
        confidenceLevel: 5,
        completionPercentage: 30,
        createdAt: new Date('2024-12-11'),
      },
      // Project 2 - Week 1
      {
        projectId: projectIds[1],
        employeeId: employee1Id,
        weekStartDate: new Date('2024-12-16'),
        progressSummary: 'Set up development environment and basic app structure',
        blockers: 'Facing issues with push notification setup',
        confidenceLevel: 3,
        completionPercentage: 20,
        createdAt: new Date('2024-12-18'),
      },
      // Project 3 - Week 1
      {
        projectId: projectIds[2],
        employeeId: employee2Id,
        weekStartDate: new Date('2024-12-16'),
        progressSummary: 'API integration partially complete',
        blockers: 'CRM vendor response time is slow, causing delays',
        confidenceLevel: 2,
        completionPercentage: 40,
        createdAt: new Date('2024-12-19'),
      },
    ];

    await db.collection('checkIns').insertMany(checkIns);
    console.log(`✅ Created ${checkIns.length} check-ins\n`);

    // Create Feedback
    console.log('💬 Creating client feedback...');
    const feedback = [
      {
        projectId: projectIds[0],
        clientId: client1Id,
        weekStartDate: new Date('2024-12-16'),
        satisfactionRating: 5,
        communicationRating: 5,
        comments: 'Excellent progress! The team is very responsive and delivers quality work.',
        issueFlagged: false,
        createdAt: new Date('2024-12-20'),
      },
      {
        projectId: projectIds[0],
        clientId: client1Id,
        weekStartDate: new Date('2024-12-09'),
        satisfactionRating: 4,
        communicationRating: 5,
        comments: 'Good work, slight delay but overall satisfied with the direction.',
        issueFlagged: false,
        createdAt: new Date('2024-12-13'),
      },
      {
        projectId: projectIds[1],
        clientId: client1Id,
        weekStartDate: new Date('2024-12-16'),
        satisfactionRating: 3,
        communicationRating: 4,
        comments: 'Concerned about the pace of development. Need more frequent updates.',
        issueFlagged: true,
        createdAt: new Date('2024-12-20'),
      },
      {
        projectId: projectIds[2],
        clientId: client2Id,
        weekStartDate: new Date('2024-12-16'),
        satisfactionRating: 2,
        communicationRating: 2,
        comments: 'Very dissatisfied with progress. Multiple deadlines missed.',
        issueFlagged: true,
        createdAt: new Date('2024-12-21'),
      },
    ];

    await db.collection('feedback').insertMany(feedback);
    console.log(`✅ Created ${feedback.length} feedback entries\n`);

    // Create Risks
    console.log('⚠️  Creating risks...');
    const risks = [
      {
        projectId: projectIds[1],
        employeeId: employee1Id,
        title: 'Push Notification Implementation Delay',
        severity: 'Medium',
        mitigationPlan: 'Researching alternative push notification services. Will decide by end of week.',
        status: 'Open',
        createdAt: new Date('2024-12-18'),
        updatedAt: new Date('2024-12-18'),
      },
      {
        projectId: projectIds[2],
        employeeId: employee2Id,
        title: 'CRM Vendor API Documentation Incomplete',
        severity: 'High',
        mitigationPlan: 'Scheduled call with vendor support team. May need to request contract addendum for better support.',
        status: 'Open',
        createdAt: new Date('2024-12-19'),
        updatedAt: new Date('2024-12-19'),
      },
      {
        projectId: projectIds[2],
        employeeId: employee2Id,
        title: 'Data Migration Complexity',
        severity: 'High',
        mitigationPlan: 'Hired external consultant with CRM migration experience. Additional 2 weeks buffer added to timeline.',
        status: 'Open',
        createdAt: new Date('2024-12-15'),
        updatedAt: new Date('2024-12-15'),
      },
      {
        projectId: projectIds[0],
        employeeId: employee1Id,
        title: 'Browser Compatibility Issues',
        severity: 'Low',
        mitigationPlan: 'Fixed using polyfills. Testing in progress.',
        status: 'Resolved',
        createdAt: new Date('2024-12-10'),
        updatedAt: new Date('2024-12-14'),
      },
    ];

    const risksResult = await db.collection('risks').insertMany(risks);
    const riskIds = Object.values(risksResult.insertedIds);
    console.log(`✅ Created ${risks.length} risks\n`);

    // Create Activity Logs
    console.log('📊 Creating activity logs...');
    const activityLogs = [
      {
        projectId: projectIds[0],
        userId: adminId,
        type: 'status_change',
        description: 'Project created',
        createdAt: new Date('2024-11-01'),
      },
      {
        projectId: projectIds[0],
        userId: employee1Id,
        type: 'checkin',
        description: 'Employee submitted weekly check-in',
        metadata: { confidenceLevel: 5, completionPercentage: 30 },
        createdAt: new Date('2024-12-11'),
      },
      {
        projectId: projectIds[0],
        userId: client1Id,
        type: 'feedback',
        description: 'Client submitted feedback',
        metadata: { satisfactionRating: 4, communicationRating: 5, issueFlagged: false },
        createdAt: new Date('2024-12-13'),
      },
      {
        projectId: projectIds[0],
        userId: employee1Id,
        type: 'checkin',
        description: 'Employee submitted weekly check-in',
        metadata: { confidenceLevel: 4, completionPercentage: 35 },
        createdAt: new Date('2024-12-17'),
      },
      {
        projectId: projectIds[0],
        userId: employee1Id,
        type: 'risk_updated',
        description: 'Risk status changed to Resolved: Browser Compatibility Issues',
        metadata: { riskId: riskIds[3], status: 'Resolved' },
        createdAt: new Date('2024-12-14'),
      },
      {
        projectId: projectIds[1],
        userId: employee1Id,
        type: 'risk_created',
        description: 'Risk created: Push Notification Implementation Delay (Medium)',
        metadata: { severity: 'Medium' },
        createdAt: new Date('2024-12-18'),
      },
      {
        projectId: projectIds[2],
        userId: employee2Id,
        type: 'risk_created',
        description: 'Risk created: CRM Vendor API Documentation Incomplete (High)',
        metadata: { severity: 'High' },
        createdAt: new Date('2024-12-19'),
      },
    ];

    await db.collection('activityLogs').insertMany(activityLogs);
    console.log(`✅ Created ${activityLogs.length} activity logs\n`);

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('Demo Credentials:');
    console.log('=================');
    console.log('Admin: admin@projectpulse.com / Admin@123');
    console.log('Employee 1: employee@projectpulse.com / Employee@123');
    console.log('Employee 2: employee2@projectpulse.com / Employee@123');
    console.log('Client 1: client@projectpulse.com / Client@123');
    console.log('Client 2: client2@projectpulse.com / Client@123\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.close();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
