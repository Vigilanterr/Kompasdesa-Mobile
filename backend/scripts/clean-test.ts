import pool from '../src/config/db';

async function main() {
  const users = await pool.query("SELECT id, role FROM users WHERE email LIKE '%@test.com'");
  const farmerIds = users.rows.filter((r: any) => r.role === 'petani').map((r: any) => r.id);
  const buyerIds = users.rows.filter((r: any) => r.role === 'pembeli').map((r: any) => r.id);

  if (buyerIds.length > 0) {
    await pool.query("DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = ANY($1::int[]))", [buyerIds]);
    await pool.query("DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE buyer_id = ANY($1::int[]))", [buyerIds]);
    await pool.query("DELETE FROM carts WHERE buyer_id = ANY($1::int[])", [buyerIds]);
  }
  if (farmerIds.length > 0 || buyerIds.length > 0) {
    await pool.query("DELETE FROM orders WHERE farmer_id = ANY($1::int[]) OR buyer_id = ANY($2::int[])", [farmerIds, buyerIds]);
    await pool.query("DELETE FROM products WHERE farmer_id = ANY($1::int[])", [farmerIds]);
  }
  await pool.query("DELETE FROM categories WHERE nama_kategori = 'Sayuran' OR nama_kategori = 'Sayuran Segar'");
  await pool.query("DELETE FROM users WHERE email LIKE '%@test.com'");
  console.log('Cleaned.');
  process.exit(0);
}
main().catch(console.error);