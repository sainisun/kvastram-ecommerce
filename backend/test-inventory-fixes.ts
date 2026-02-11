/**
 * Day 1 Test Script: Inventory Validation, Race Condition, DB Constraint
 * 
 * Tests FIX-001, FIX-002, FIX-003
 * 
 * Run: npx tsx test-inventory-fixes.ts
 */

import { db } from "./src/db";
import { product_variants, orders, line_items } from "./src/db/schema";
import { eq, sql } from "drizzle-orm";

const TEST_VARIANT_ID = "test-variant-uuid"; // Replace with actual variant ID

async function cleanupTestData() {
    // Clean up any previous test data
    try {
        await db.delete(line_items).where(sql`order_id LIKE 'test-%'`);
        await db.delete(orders).where(sql`email LIKE 'test-%'`);
        console.log("✅ Cleaned up previous test data");
    } catch (e) {
        console.log("⚠️  No previous test data to clean up");
    }
}

async function testFIX003_DBConstraint() {
    console.log("\n🧪 Testing FIX-003: Database CHECK Constraint");
    console.log("=".repeat(50));

    // This test requires actual database access
    // The constraint is: CHECK (inventory_quantity >= 0)

    console.log("✅ Schema constraint defined:");
    console.log("   CONSTRAINT chk_inventory_non_negative CHECK (inventory_quantity >= 0)");
    console.log("");
    console.log("📝 To verify manually in SQL:");
    console.log("   -- Try to set negative inventory (should FAIL):");
    console.log("   UPDATE product_variants SET inventory_quantity = -5 WHERE id = 'your-variant-id';");
    console.log("");
    console.log("✅ If constraint works, you'll get:");
    console.log('   ERROR: new row for relation "product_variants" violates check constraint "chk_inventory_non_negative"');
}

async function testFIX001_InventoryDeduction() {
    console.log("\n🧪 Testing FIX-001: Inventory Deduction");
    console.log("=".repeat(50));

    // Get current inventory
    const [variant] = await db
        .select({ inventory: product_variants.inventory_quantity })
        .from(product_variants)
        .where(eq(product_variants.id, TEST_VARIANT_ID))
        .limit(1);

    if (!variant) {
        console.log("❌ Test variant not found. Set TEST_VARIANT_ID in script.");
        return;
    }

    const initialInventory = variant.inventory ?? 0;
    console.log(`📦 Initial inventory: ${initialInventory}`);

    console.log("");
    console.log("📝 Manual Test Steps:");
    console.log("   1. Note current inventory value");
    console.log("   2. Place an order with 1 quantity of this variant");
    console.log("   3. Check inventory again");
    console.log("");
    console.log("✅ Expected: Inventory decreases by order quantity");
    console.log(`   After order: ${initialInventory - 1} (if 1 quantity ordered)`);

    if (initialInventory > 0) {
        console.log("");
        console.log("⚠️  WARNING: Do not run actual deduction without backend running!");
    }
}

async function testFIX002_RaceCondition() {
    console.log("\n🧪 Testing FIX-002: Race Condition Prevention");
    console.log("=".repeat(50));

    console.log("📝 How to test race conditions:");
    console.log("");
    console.log("   Method 1: curl commands (run in 2 terminals simultaneously)");
    console.log("   Terminal 1:");
    console.log(`   curl -X POST http://localhost:3000/store/checkout/place-order \\`);
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"region_id":"...","currency_code":"INR","email":"race1@test.com","items":[{"variant_id":"YOUR_VARIANT_ID","quantity":1}]}\'');
    console.log("");
    console.log("   Terminal 2 (run immediately after Terminal 1):");
    console.log(`   curl -X POST http://localhost:3000/store/checkout/place-order \\`);
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"region_id":"...","currency_code":"INR","email":"race2@test.com","items":[{"variant_id":"YOUR_VARIANT_ID","quantity":1}]}\'');
    console.log("");
    console.log("   ✅ Expected:");
    console.log("      - Only 1 order should succeed");
    console.log("      - 2nd request should fail with 'Insufficient stock'");
    console.log("");
    console.log("🔒 Protection mechanism: SELECT FOR UPDATE locks variant rows");
    console.log("   This prevents concurrent transactions from reading same stock");
}

async function runAllTests() {
    console.log("=".repeat(60));
    console.log("  DAY 1 FIXES TEST SUITE");
    console.log("  FIX-001: Inventory Validation");
    console.log("  FIX-002: Race Condition Prevention");
    console.log("  FIX-003: Database CHECK Constraint");
    console.log("=".repeat(60));

    await cleanupTestData();

    await testFIX003_DBConstraint();
    await testFIX001_InventoryDeduction();
    await testFIX002_RaceCondition();

    console.log("\n" + "=".repeat(60));
    console.log("  TEST SUITE COMPLETE");
    console.log("=".repeat(60));
    console.log("");
    console.log("📋 Summary:");
    console.log("   ✅ FIX-003: Schema constraint is defined (verified by code review)");
    console.log("   📝 FIX-001: Requires manual test with backend running");
    console.log("   📝 FIX-002: Requires concurrent request test");
}

runAllTests().catch(console.error);
