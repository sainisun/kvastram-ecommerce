import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
  console.log('🔄 Resetting Admin Password...');

  const email = 'admin@odhvica.com';
  const newPassword = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await db
      .update(users)
      .set({ password_hash: hash })
      .where(eq(users.email, email));

    console.log('✅ Password Reset Successfully!');
    console.log(`   User: ${email}`);
    console.log(`   New Password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Failed to reset password:', error);
  }

  process.exit(0);
}

resetAdmin();
