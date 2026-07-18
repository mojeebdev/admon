import { prisma } from '../app/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKET } from '../app/lib/supabase';
import { generateCarPng } from '@/app/lib/imageGen';

async function main() {
  const minted = await prisma.car.findMany({
    where: { mintedAt: { not: null }, imageUrl: null },
  });
  console.log(`Backfilling ${minted.length} minted cars...`);

  for (const car of minted) {
    try {
      const png = await generateCarPng(car);
      const path = `${car.githubUsername}-${car.tokenId ?? Date.now()}.png`;
      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(path, png, { contentType: 'image/png', upsert: true });
      if (error) { console.error(`× ${car.githubUsername}: ${error.message}`); continue; }
      const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      await prisma.car.update({
        where: { id: car.id },
        data: { imageUrl: data.publicUrl },
      });
      console.log(`✓ ${car.githubUsername} → ${data.publicUrl}`);
    } catch (e: any) {
      console.error(`× ${car.githubUsername}: ${e.message}`);
    }
  }
}

main().then(() => process.exit(0));