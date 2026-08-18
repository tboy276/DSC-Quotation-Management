const fs = require('fs');

let content = fs.readFileSync('src/lib/user-service.ts', 'utf8');

if (!content.includes("import { logAudit }")) {
  content = content.replace("import type { UserProfile } from '../types';", "import type { UserProfile } from '../types';\nimport { logAudit } from './audit-service';");
}

content = content.replace(
  /(export const updateUserRole = async \(userId: string, newRole: string)(, email\?: string)?(\): Promise<void> => \{[\s\S]*?)(  if \(error\) \{[\s\S]*?\}\n\})/,
  "export const updateUserRole = async (userId: string, newRole: string, email?: string): Promise<void> => {\n  const { error } = await supabase\n    .from('user_profiles')\n    .update({ role: newRole })\n    .eq('id', userId);\n\n  if (error) {\n    throw new Error(`Lỗi cập nhật vai trò: ${error.message}`);\n  }\n  await logAudit('UPDATE_USER_ROLE', 'user_profiles', userId, { target_email: email || userId, new_role: newRole });\n}"
);

content = content.replace(
  /(export const revokeUserProfile = async \(userId: string)(, email\?: string)?(\): Promise<void> => \{[\s\S]*?)(  if \(error\) \{[\s\S]*?\}\n\})/,
  "export const revokeUserProfile = async (userId: string, email?: string): Promise<void> => {\n  const { error } = await supabase\n    .from('user_profiles')\n    .delete()\n    .eq('id', userId);\n\n  if (error) {\n    throw new Error(`Lỗi thu hồi quyền: ${error.message}`);\n  }\n  await logAudit('REVOKE_USER_PROFILE', 'user_profiles', userId, { email: email || userId });\n}"
);

content = content.replace(
  /(export const addAllowedUser = async \(email: string, role: 'viewer' | 'sales' | 'admin', addedByEmail: string\): Promise<void> => \{[\s\S]*?)(  if \(error\) \{[\s\S]*?\}\n\})/,
  "$1  if (error) {\n    throw new Error('Lỗi thêm email vào allowlist: ' + error.message);\n  }\n  await logAudit('ADD_ALLOWED_EMAIL', 'allowed_users', email, { email, role });\n}"
);

content = content.replace(
  /(export const removeAllowedUser = async \(email: string\): Promise<void> => \{[\s\S]*?)(  if \(error\) \{[\s\S]*?\}\n\})/,
  "$1  if (error) {\n    throw new Error('Lỗi xóa email khỏi allowlist: ' + error.message);\n  }\n  await logAudit('REMOVE_ALLOWED_EMAIL', 'allowed_users', email, { email });\n}"
);

fs.writeFileSync('src/lib/user-service.ts', content, 'utf8');
