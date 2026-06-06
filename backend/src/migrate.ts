#!/usr/bin/env node
/**
 * Database migration script for Supabase
 * Run: npm run migrate
 * This script will:
 * 1. Create tables
 * 2. Create roles and permissions
 * 3. Insert seed data
 */

import fs from 'fs';
import path from 'path';
import { supabase } from './lib/supabase';

async function main() {
  console.log('🚀 Starting Starverse Express database migration...\n');

  try {
    // Read schema from file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by statement and execute
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute.\n`);

    // Note: Supabase client doesn't directly execute raw SQL in this way
    // You need to use the SQL editor or psql CLI
    console.log('⚠️  To complete the migration, please:');
    console.log('1. Go to https://supabase.co/dashboard/project/hhbfsyihyuajatxpivcp/sql');
    console.log('2. Copy the contents of database/schema.sql');
    console.log('3. Paste and run in the Supabase SQL editor\n');

    // Seed data using API
    await seedData();

    console.log('✅ Migration preparation complete!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function seedData() {
  console.log('📊 Seeding initial data...\n');

  try {
    // Create roles
    const roles = [
      { name: 'super_admin', description: 'System administrator' },
      { name: 'admin', description: 'Operations manager' },
      { name: 'shop_assistant', description: 'Collection point operator' },
      { name: 'driver', description: 'Parcel transporter' },
      { name: 'clerk', description: 'Logistics assistant' },
      { name: 'accountant', description: 'Financial controller' },
      { name: 'logistics_manager', description: 'Route and fleet manager' },
      { name: 'customer', description: 'Parcel customer' }
    ];

    for (const role of roles) {
      const { error } = await supabase.from('roles').upsert(
        { name: role.name, description: role.description },
        { onConflict: 'name' }
      );

      if (error) console.error(`Failed to seed role ${role.name}:`, error);
      else console.log(`✓ Role: ${role.name}`);
    }

    // Create permissions
    const permissions = [
      'create_shipment',
      'scan_parcel',
      'verify_otp',
      'approve_manifest',
      'view_finances',
      'manage_users',
      'manage_franchise',
      'assign_driver',
      'generate_report',
      'manage_collection_point'
    ];

    for (const permName of permissions) {
      const { error } = await supabase.from('permissions').upsert(
        { name: permName, description: `Permission to ${permName}` },
        { onConflict: 'name' }
      );

      if (error) console.error(`Failed to seed permission ${permName}:`, error);
      else console.log(`✓ Permission: ${permName}`);
    }

    console.log('\n✅ Seed data complete!\n');
  } catch (error) {
    console.error('Seed error:', error);
  }
}

main();
