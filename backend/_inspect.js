const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const ORG = 'cffad2b6-0e42-40e8-a1ee-68a012f9bf99';

  console.log('=== concerns with full columns ===');
  const concerns = await p.concern.findMany({ where: { org_id: ORG }, select: { id: true, subject: true, sender_role: true, sender_account_id: true, last_message_at: true, created_at: true, status: true, category_id: true } });
  console.log(JSON.stringify(concerns, null, 1));

  console.log('=== replicate listStaff findMany ===');
  const data = await p.concern.findMany({
    where: { org_id: ORG },
    include: {
      category: { select: { id: true, label: true, is_default: true, is_active: true } },
      messages: { orderBy: { created_at: 'desc' }, take: 1, select: { id: true, sender_name: true, body: true, created_at: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { last_message_at: 'desc' },
    skip: 0, take: 20,
  });
  console.log('LIST count:', data.length);
  console.log(JSON.stringify(data, null, 1));

  console.log('=== sender accounts ===');
  const senders = await p.account.findMany({ where: { id: { in: concerns.map(c => c.sender_account_id) } }, select: { id: true, org_id: true, role: true, email: true } });
  console.log(JSON.stringify(senders, null, 1));

  console.log('=== all admins in this org ===');
  console.log(await p.account.findMany({ where: { org_id: ORG, role: 'admin' }, select: { id: true, email: true, status: true } }));

  const sets = await p.orgConcernSetting.findMany({ where: { org_id: ORG } });
  console.log('orgConcernSetting:', JSON.stringify(sets));
})().finally(() => p.$disconnect());